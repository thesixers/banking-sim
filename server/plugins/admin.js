import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db, transaction } from "../db/index.js";
import { requireAdmin } from "../middleware/auth.js";
import {
  generateReferenceId,
  generateTransactionAlertHtml,
} from "../utils/helpers.js";

export default async function adminPlugin(api) {
  /**
   * GET /stats
   * Global banking telemetry and vault analytics
   */
  api.get("/stats", { intercept: requireAdmin }, (req, res) => {
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'CUSTOMER'").get().count;
    const totalAccounts = db.prepare("SELECT COUNT(*) as count FROM accounts").get().count;
    const vault = db.prepare("SELECT SUM(balance) as total FROM accounts").get();
    const totalVaultBalance = vault.total || 0;

    const totalTx = db.prepare("SELECT COUNT(*) as count, SUM(amount) as volume FROM transactions").get();
    const pendingWires = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE status = 'PENDING_OTP'").get().count;
    const frozenCount = db.prepare("SELECT COUNT(*) as count FROM accounts WHERE is_frozen = 1").get().count;

    const recentTx = db.prepare(`
      SELECT t.id, t.reference_id, t.type, t.amount, t.fee, t.status, t.description, t.created_at,
             sender_user.full_name as sender_name, recipient_user.full_name as recipient_name
      FROM transactions t
      LEFT JOIN accounts sender_acc ON t.sender_account_id = sender_acc.id
      LEFT JOIN users sender_user ON sender_acc.user_id = sender_user.id
      LEFT JOIN accounts recipient_acc ON t.recipient_account_id = recipient_acc.id
      LEFT JOIN users recipient_user ON recipient_acc.user_id = recipient_user.id
      ORDER BY t.rowid DESC
      LIMIT 6
    `).all();

    return res.success({
      stats: {
        total_customers: totalUsers,
        total_accounts: totalAccounts,
        vault_liquidity: totalVaultBalance,
        total_transactions: totalTx.count || 0,
        total_volume: totalTx.volume || 0,
        pending_wires: pendingWires,
        frozen_accounts: frozenCount,
        recent_transactions: recentTx,
      },
    });
  });

  /**
   * GET /users
   * List all bank customers with checking account details
   */
  api.get("/users", { intercept: requireAdmin }, (req, res) => {
    const { search = "", limit = "50", offset = "0" } = req.query || {};
    const cleanSearch = `%${search.trim().toLowerCase()}%`;

    const users = db.prepare(`
      SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.role, 
        u.created_at,
        a.id as account_id,
        a.account_number,
        a.routing_number,
        a.account_type,
        a.balance,
        a.is_frozen,
        a.card_number,
        a.card_expiry,
        (SELECT COUNT(*) FROM transactions t WHERE t.sender_account_id = a.id OR t.recipient_account_id = a.id) as transaction_count
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      WHERE lower(u.full_name) LIKE ? OR lower(u.email) LIKE ? OR a.account_number LIKE ?
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).all(cleanSearch, cleanSearch, cleanSearch, parseInt(limit, 10), parseInt(offset, 10));

    return res.success({ users });
  });

  /**
   * GET /users/:id
   * Detailed single customer view with transaction ledger & notifications
   */
  api.get("/users/:id", { intercept: requireAdmin }, (req, res) => {
    const { id } = req.params;

    const user = db.prepare(`
      SELECT id, full_name, email, role, phone_number, created_at
      FROM users
      WHERE id = ?
    `).get(id);

    if (!user) {
      return res.notFound("Customer not found");
    }

    const account = db.prepare(`
      SELECT id, account_number, routing_number, account_type, balance, currency, card_number, card_cvv, card_expiry, is_frozen, created_at
      FROM accounts
      WHERE user_id = ?
    `).get(user.id);

    let userTransactions = [];
    if (account) {
      userTransactions = db.prepare(`
        SELECT t.*, 
               sender_user.full_name as sender_name, recipient_user.full_name as recipient_name
        FROM transactions t
        LEFT JOIN accounts sender_acc ON t.sender_account_id = sender_acc.id
        LEFT JOIN users sender_user ON sender_acc.user_id = sender_user.id
        LEFT JOIN accounts recipient_acc ON t.recipient_account_id = recipient_acc.id
        LEFT JOIN users recipient_user ON recipient_acc.user_id = recipient_user.id
        WHERE t.sender_account_id = ? OR t.recipient_account_id = ?
        ORDER BY t.rowid DESC
        LIMIT 25
      `).all(account.id, account.id);
    }

    const notifications = db.prepare(`
      SELECT id, title, subject, message, type, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY rowid DESC
      LIMIT 10
    `).all(user.id);

    return res.success({
      user,
      account,
      transactions: userTransactions,
      notifications,
    });
  });

  /**
   * POST /users/:id/adjust-balance
   * Master Admin balance control: CREDIT, DEBIT, or SET exact balance
   */
  api.post("/users/:id/adjust-balance", { intercept: requireAdmin }, (req, res) => {
    const { id } = req.params;
    const { action, amount, reason = "Administrative Balance Adjustment" } = req.body || {};

    const numAmount = Number(amount);
    if (isNaN(numAmount) || (action !== "SET" && numAmount <= 0) || (action === "SET" && numAmount < 0)) {
      return res.badRequest("Valid positive numeric amount is required");
    }

    const user = db.prepare("SELECT id, full_name, email FROM users WHERE id = ?").get(id);
    if (!user) return res.notFound("User not found");

    const account = db.prepare("SELECT id, balance FROM accounts WHERE user_id = ?").get(id);
    if (!account) return res.notFound("Account not found for this user");

    const prevBalance = account.balance;
    let newBalance = prevBalance;
    let delta = 0;
    let txType = "ADMIN_ADJUSTMENT";
    let isCredit = true;

    if (action === "CREDIT") {
      delta = numAmount;
      newBalance = prevBalance + delta;
      isCredit = true;
    } else if (action === "DEBIT") {
      delta = numAmount;
      if (prevBalance < delta) {
        return res.badRequest(`Cannot debit $${delta.toFixed(2)}. Available balance is $${prevBalance.toFixed(2)}.`);
      }
      newBalance = prevBalance - delta;
      isCredit = false;
    } else if (action === "SET") {
      if (numAmount === prevBalance) {
        return res.success({ previous_balance: prevBalance, new_balance: newBalance }, "Balance is already at this amount");
      }
      if (numAmount > prevBalance) {
        delta = numAmount - prevBalance;
        newBalance = numAmount;
        isCredit = true;
      } else {
        delta = prevBalance - numAmount;
        newBalance = numAmount;
        isCredit = false;
      }
    } else {
      return res.badRequest("Invalid action: must be CREDIT, DEBIT, or SET");
    }

    const refId = generateReferenceId("ADM");

    // Email notification for transparency
    const alertHtml = generateTransactionAlertHtml({
      fullName: user.full_name,
      type: isCredit ? "CREDIT" : "DEBIT",
      amount: delta,
      counterparty: `Federal Core / Administrator (${reason})`,
      referenceId: refId,
      newBalance,
    });

    transaction(() => {
      // 1. Update account balance
      db.prepare("UPDATE accounts SET balance = ? WHERE id = ?").run(newBalance, account.id);

      // 2. Record ledger transaction
      db.prepare(`
        INSERT INTO transactions (
          id, reference_id, sender_account_id, recipient_account_id, type, amount, fee, status, description
        ) VALUES (?, ?, ?, ?, 'ADMIN_ADJUSTMENT', ?, 0.00, 'COMPLETED', ?)
      `).run(
        crypto.randomUUID(),
        refId,
        isCredit ? null : account.id,
        isCredit ? account.id : null,
        delta,
        `Admin ${action}: ${reason}`
      );

      // 3. Queue Email notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, email, title, subject, message, html_content, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'EMAIL')
      `).run(
        crypto.randomUUID(),
        user.id,
        user.email,
        isCredit ? "Admin Credit Adjustment" : "Admin Debit Adjustment",
        `Account Adjustment: ${isCredit ? `+$${delta.toFixed(2)}` : `-$${delta.toFixed(2)}`}`,
        `Your account balance was adjusted by an administrator. ${isCredit ? "Credited" : "Debited"} $${delta.toFixed(2)}. New balance: $${newBalance.toFixed(2)}. Ref: ${refId}.`,
        alertHtml
      );
    });

    return res.success(
      {
        user_id: user.id,
        account_id: account.id,
        previous_balance: prevBalance,
        new_balance: newBalance,
        adjustment: delta,
        action,
        reference_id: refId,
      },
      `Successfully adjusted balance to $${newBalance.toFixed(2)}`
    );
  });

  /**
   * POST /users/:id/toggle-freeze
   * Freeze or unfreeze a user's account and debit card
   */
  api.post("/users/:id/toggle-freeze", { intercept: requireAdmin }, (req, res) => {
    const { id } = req.params;
    const { is_frozen } = req.body || {};

    const account = db.prepare("SELECT id, is_frozen FROM accounts WHERE user_id = ?").get(id);
    if (!account) return res.notFound("Account not found");

    const newFreeze = typeof is_frozen === "number" ? is_frozen : (account.is_frozen === 1 ? 0 : 1);
    db.prepare("UPDATE accounts SET is_frozen = ? WHERE id = ?").run(newFreeze, account.id);

    return res.success(
      { is_frozen: newFreeze },
      `Account has been ${newFreeze === 1 ? "frozen" : "unfrozen"} by Administrator`
    );
  });

  /**
   * POST /users/:id/reset-password
   * Admin password override for customer
   */
  api.post("/users/:id/reset-password", { intercept: requireAdmin }, (req, res) => {
    const { id } = req.params;
    const { new_password } = req.body || {};

    if (!new_password || new_password.length < 6) {
      return res.badRequest("Password must be at least 6 characters long");
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(new_password, salt);

    const result = db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(password_hash, id);
    if (result.changes === 0) return res.notFound("User not found");

    return res.success({ ok: true }, "Password has been reset successfully");
  });

  /**
   * DELETE /users/:id
   * Wipe customer from system
   */
  const deleteUserHandler = (req, res) => {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.badRequest("You cannot delete your own master administrator account");
    }

    const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
    if (result.changes === 0) return res.notFound("User not found");

    return res.success({ ok: true }, "Customer account completely removed");
  };

  api.del("/users/:id", { intercept: requireAdmin }, deleteUserHandler);
  api.post("/users/:id/delete", { intercept: requireAdmin }, deleteUserHandler);

  /**
   * GET /transactions
   * Global transaction ledger with filtering
   */
  api.get("/transactions", { intercept: requireAdmin }, (req, res) => {
    const { type, status, search = "", limit = "50", offset = "0" } = req.query || {};

    let query = `
      SELECT t.*,
             sender_user.full_name as sender_name, sender_user.email as sender_email,
             recipient_user.full_name as recipient_name, recipient_user.email as recipient_email,
             sender_acc.account_number as sender_account_number,
             recipient_acc.account_number as recipient_account_number
      FROM transactions t
      LEFT JOIN accounts sender_acc ON t.sender_account_id = sender_acc.id
      LEFT JOIN users sender_user ON sender_acc.user_id = sender_user.id
      LEFT JOIN accounts recipient_acc ON t.recipient_account_id = recipient_acc.id
      LEFT JOIN users recipient_user ON recipient_acc.user_id = recipient_user.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      query += ` AND t.type = ?`;
      params.push(type.toUpperCase());
    }

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status.toUpperCase());
    }

    if (search.trim()) {
      const cleanSearch = `%${search.trim().toLowerCase()}%`;
      query += ` AND (lower(t.reference_id) LIKE ? OR lower(t.description) LIKE ? OR lower(sender_user.full_name) LIKE ? OR lower(recipient_user.full_name) LIKE ?)`;
      params.push(cleanSearch, cleanSearch, cleanSearch, cleanSearch);
    }

    query += ` ORDER BY t.rowid DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const rows = db.prepare(query).all(...params);

    const formatted = rows.map((tx) => {
      let ext = null;
      if (tx.external_bank_details) {
        try { ext = JSON.parse(tx.external_bank_details); } catch {}
      }
      return { ...tx, external_bank_details: ext };
    });

    return res.success({ transactions: formatted });
  });

  /**
   * POST /transactions/:id/action
   * Override wire transfers: FORCE_APPROVE, FORCE_CANCEL, or REVERSE
   */
  api.post("/transactions/:id/action", { intercept: requireAdmin }, (req, res) => {
    const { id } = req.params;
    const { action } = req.body || {};

    const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id);
    if (!tx) return res.notFound("Transaction not found");

    if (action === "FORCE_APPROVE") {
      if (tx.status !== "PENDING_OTP") {
        return res.badRequest("Only PENDING_OTP transactions can be force-approved");
      }

      const sender = db.prepare("SELECT balance FROM accounts WHERE id = ?").get(tx.sender_account_id);
      const total = tx.amount + (tx.fee || 0);

      if (sender.balance < total) {
        return res.badRequest("Sender has insufficient balance to complete wire transfer");
      }

      transaction(() => {
        // Debit sender
        db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(total, tx.sender_account_id);
        // Mark transaction completed
        db.prepare("UPDATE transactions SET status = 'COMPLETED' WHERE id = ?").run(tx.id);
        // Mark associated OTP token verified
        db.prepare("UPDATE otp_tokens SET verified = 1 WHERE reference_id = ?").run(tx.reference_id);
      });

      return res.success({ ok: true, status: "COMPLETED" }, "Wire transfer has been force-approved by Administrator");
    }

    if (action === "FORCE_CANCEL") {
      if (tx.status !== "PENDING_OTP") {
        return res.badRequest("Only PENDING_OTP transactions can be cancelled");
      }

      db.prepare("UPDATE transactions SET status = 'FAILED' WHERE id = ?").run(tx.id);
      return res.success({ ok: true, status: "FAILED" }, "Wire transfer cancelled by Administrator");
    }

    if (action === "REVERSE") {
      if (tx.status !== "COMPLETED") {
        return res.badRequest("Only COMPLETED transactions can be reversed");
      }

      transaction(() => {
        // Refund sender if debit occurred
        if (tx.sender_account_id) {
          db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(tx.amount + (tx.fee || 0), tx.sender_account_id);
        }
        // Deduct from recipient if internal
        if (tx.recipient_account_id) {
          db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(tx.amount, tx.recipient_account_id);
        }
        // Mark reversed
        db.prepare("UPDATE transactions SET status = 'REVERSED' WHERE id = ?").run(tx.id);
      });

      return res.success({ ok: true, status: "REVERSED" }, "Transaction has been reversed and funds restored");
    }

    return res.badRequest("Invalid action: must be FORCE_APPROVE, FORCE_CANCEL, or REVERSE");
  });

  /**
   * GET /otp-tokens
   * Master monitor of all active and historical OTP tokens
   */
  api.get("/otp-tokens", { intercept: requireAdmin }, (req, res) => {
    const tokens = db.prepare(`
      SELECT o.id, o.user_id, o.email, o.purpose, o.reference_id, o.attempts, o.max_attempts, o.verified, o.expires_at, o.created_at,
             u.full_name
      FROM otp_tokens o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.rowid DESC
      LIMIT 50
    `).all();

    return res.success({ tokens });
  });

  /**
   * POST /otp-tokens/:id/force-verify
   * Manually verify an OTP token
   */
  api.post("/otp-tokens/:id/force-verify", { intercept: requireAdmin }, (req, res) => {
    const { id } = req.params;
    db.prepare("UPDATE otp_tokens SET verified = 1 WHERE id = ?").run(id);
    return res.success({ ok: true }, "OTP token manually verified");
  });
}
