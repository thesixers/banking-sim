import crypto from "crypto";
import { db, transaction } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { generateReferenceId, generateTransactionAlertHtml } from "../utils/helpers.js";

export default async function accountsPlugin(api) {
  /**
   * GET /
   * Returns primary account summary, balance, and virtual card
   */
  api.get("/", { intercept: requireAuth }, (req, res) => {
    const account = db.prepare(`
      SELECT id, account_number, routing_number, account_type, balance, currency, card_number, card_cvv, card_expiry, card_status, card_applied_at, is_frozen, created_at
      FROM accounts
      WHERE user_id = ?
    `).get(req.user.id);

    return res.success({ account });
  });

  /**
   * GET /transactions
   * Retrieves transaction ledger for the authenticated user's account
   */
  api.get("/transactions", { intercept: requireAuth }, (req, res) => {
    const accountId = req.account.id;
    const { type, limit = "50" } = req.query || {};

    let query = `
      SELECT 
        t.id, 
        t.reference_id, 
        t.sender_account_id, 
        t.recipient_account_id, 
        t.type, 
        t.amount, 
        t.fee, 
        t.currency, 
        t.status, 
        t.external_bank_details, 
        t.description, 
        t.created_at,
        sender_user.full_name as sender_name,
        recipient_user.full_name as recipient_name,
        sender_acc.account_number as sender_account_number,
        recipient_acc.account_number as recipient_account_number
      FROM transactions t
      LEFT JOIN accounts sender_acc ON t.sender_account_id = sender_acc.id
      LEFT JOIN users sender_user ON sender_acc.user_id = sender_user.id
      LEFT JOIN accounts recipient_acc ON t.recipient_account_id = recipient_acc.id
      LEFT JOIN users recipient_user ON recipient_acc.user_id = recipient_user.id
      WHERE (t.sender_account_id = ? OR t.recipient_account_id = ?)
    `;

    const params = [accountId, accountId];

    if (type) {
      query += ` AND t.type = ?`;
      params.push(type.toUpperCase());
    }

    query += ` ORDER BY t.created_at DESC LIMIT ?`;
    params.push(Math.min(parseInt(limit, 10) || 50, 100));

    const rows = db.prepare(query).all(...params);

    // Decorate each transaction with direction (INFLOW vs OUTFLOW)
    const formatted = rows.map((tx) => {
      const isOutflow = tx.sender_account_id === accountId;
      let external = null;
      if (tx.external_bank_details) {
        try {
          external = JSON.parse(tx.external_bank_details);
        } catch {
          external = null;
        }
      }

      return {
        ...tx,
        external_bank_details: external,
        direction: isOutflow ? "OUTFLOW" : "INFLOW",
        net_amount: isOutflow ? -(tx.amount + (tx.fee || 0)) : tx.amount,
      };
    });

    return res.success({ transactions: formatted });
  });

  /**
   * POST /faucet
   * Disabled: Account balance adjustments are strictly restricted to Master Administrator Vault Controls.
   */
  api.post("/faucet", (req, res) => {
    return res.status(403).json({
      success: false,
      error: "Self top-up is disabled. Account funding and balance adjustments must be authorized by an Administrator.",
    });
  });

  /**
   * POST /card/apply
   * User applies for a debit card (requires admin approval)
   */
  api.post("/card/apply", { intercept: requireAuth }, (req, res) => {
    const account = db.prepare("SELECT id, card_status FROM accounts WHERE user_id = ?").get(req.user.id);
    if (!account) return res.notFound("Account not found");

    if (account.card_status === "ACTIVE") {
      return res.badRequest("You already have an active Visa debit card.");
    }
    if (account.card_status === "PENDING") {
      return res.success({ card_status: "PENDING" }, "Your card application is already under administrative review.");
    }

    const appliedAt = new Date().toISOString().replace("T", " ").slice(0, 19);
    transaction(() => {
      db.prepare(`
        UPDATE accounts SET card_status = 'PENDING', card_applied_at = ? WHERE id = ?
      `).run(appliedAt, account.id);

      db.prepare(`
        INSERT INTO notifications (id, user_id, email, title, subject, message, type)
        VALUES (?, ?, ?, 'Card Application Submitted', 'First Horizon Platinum Card Request Received',
                'Your application for a First Horizon Platinum Virtual Visa debit card has been submitted. An administrator will review your application before card issuance.', 'EMAIL')
      `).run(crypto.randomUUID(), req.user.id, req.user.email);
    });

    return res.success(
      { card_status: "PENDING", card_applied_at: appliedAt },
      "Your card application has been submitted and is pending administrator approval."
    );
  });

  /**
   * POST /card/toggle-freeze
   * Freeze or unfreeze the virtual debit card
   */
  api.post("/card/toggle-freeze", { intercept: requireAuth }, (req, res) => {
    const accountId = req.account.id;
    const current = db.prepare("SELECT is_frozen, card_status FROM accounts WHERE id = ?").get(accountId);
    if (!current || current.card_status !== "ACTIVE") {
      return res.badRequest("You do not have an active debit card.");
    }
    const newStatus = current.is_frozen === 1 ? 0 : 1;

    db.prepare("UPDATE accounts SET is_frozen = ? WHERE id = ?").run(newStatus, accountId);

    return res.success(
      { is_frozen: newStatus },
      newStatus === 1 ? "Virtual card frozen for security" : "Virtual card unfrozen and active"
    );
  });
}
