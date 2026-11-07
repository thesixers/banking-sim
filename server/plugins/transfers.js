import crypto from "crypto";
import { rateLimit } from "vibe-gx";
import { db, transaction } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import {
  generateReferenceId,
  generateOtpCode,
  hashOtp,
  maskEmail,
  generateWireOtpEmailHtml,
  generateWireOtpPlainText,
  generateTransactionAlertHtml,
} from "../utils/helpers.js";

export default async function transfersPlugin(api) {
  // OTP verification rate limit: 5 attempts per 3 minutes
  const otpLimiter = rateLimit({
    max: 5,
    window: 180_000,
    message: "Too many verification attempts. Please request a new OTP code.",
  });

  /**
   * POST /verify-recipient
   * Resolves recipient name by Account Number or Email before transferring
   */
  api.post("/verify-recipient", { intercept: requireAuth }, (req, res) => {
    const { identifier } = req.body || {};
    if (!identifier) {
      return res.badRequest("Account number or email address is required");
    }

    const clean = identifier.trim().toLowerCase();

    const recipient = db.prepare(`
      SELECT u.id as user_id, u.full_name, u.email, a.id as account_id, a.account_number, a.is_frozen
      FROM users u
      JOIN accounts a ON u.id = a.user_id
      WHERE a.account_number = ? OR lower(u.email) = ?
    `).get(identifier.trim(), clean);

    if (!recipient) {
      return res.notFound("Recipient account not found within Nova Bank");
    }

    if (recipient.user_id === req.user.id) {
      return res.badRequest("You cannot transfer money to your own account");
    }

    if (recipient.is_frozen === 1) {
      return res.badRequest("Recipient account is currently frozen and cannot receive funds");
    }

    // Mask account number for preview (e.g. 1042••••89)
    const accNum = recipient.account_number;
    const masked = `${accNum.slice(0, 4)}••••${accNum.slice(-2)}`;

    return res.success({
      recipient_name: recipient.full_name,
      account_number: recipient.account_number,
      masked_account_number: masked,
    });
  });

  /**
   * POST /internal
   * Instant transfer between Nova Bank accounts
   */
  api.post("/internal", { intercept: requireAuth }, (req, res) => {
    const { recipient_account_number, amount, description = "Internal Transfer" } = req.body || {};

    const transferAmount = Number(amount);
    if (!recipient_account_number || isNaN(transferAmount) || transferAmount <= 0) {
      return res.badRequest("Valid recipient account number and positive amount are required");
    }

    if (transferAmount > 25000) {
      return res.badRequest("Maximum single internal transfer limit is $25,000.00");
    }

    const senderAccountId = req.account.id;
    const senderUserId = req.user.id;

    // Check sender account status
    const sender = db.prepare("SELECT balance, is_frozen FROM accounts WHERE id = ?").get(senderAccountId);
    if (sender.is_frozen === 1) {
      return res.badRequest("Your account is currently frozen. Please contact customer support.");
    }

    if (sender.balance < transferAmount) {
      return res.badRequest(
        `Insufficient funds. Current balance: $${sender.balance.toFixed(2)}, required: $${transferAmount.toFixed(2)}`
      );
    }

    // Lookup recipient
    const recipient = db.prepare(`
      SELECT a.id as account_id, a.account_number, a.balance, a.is_frozen, u.id as user_id, u.full_name, u.email
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE a.account_number = ?
    `).get(recipient_account_number.trim());

    if (!recipient) {
      return res.notFound("Recipient account number does not exist");
    }

    if (recipient.account_id === senderAccountId) {
      return res.badRequest("Cannot transfer funds to the same account");
    }

    if (recipient.is_frozen === 1) {
      return res.badRequest("Recipient account cannot receive transfers at this time");
    }

    const refId = generateReferenceId("INT");
    const senderNewBalance = sender.balance - transferAmount;
    const recipientNewBalance = recipient.balance + transferAmount;

    // Email alert HTML
    const senderEmailHtml = generateTransactionAlertHtml({
      fullName: req.user.full_name,
      type: "DEBIT",
      amount: transferAmount,
      counterparty: `${recipient.full_name} (${recipient.account_number})`,
      referenceId: refId,
      newBalance: senderNewBalance,
    });

    const recipientEmailHtml = generateTransactionAlertHtml({
      fullName: recipient.full_name,
      type: "CREDIT",
      amount: transferAmount,
      counterparty: `${req.user.full_name} (${req.account.account_number})`,
      referenceId: refId,
      newBalance: recipientNewBalance,
    });

    // Atomic execution
    transaction(() => {
      // 1. Debit sender
      db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(transferAmount, senderAccountId);

      // 2. Credit recipient
      db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(transferAmount, recipient.account_id);

      // 3. Write transaction ledger
      db.prepare(`
        INSERT INTO transactions (
          id, reference_id, sender_account_id, recipient_account_id, type, amount, fee, status, description
        ) VALUES (?, ?, ?, ?, 'INTERNAL', ?, 0.00, 'COMPLETED', ?)
      `).run(crypto.randomUUID(), refId, senderAccountId, recipient.account_id, transferAmount, description);

      // 4. Sender Email Alert
      db.prepare(`
        INSERT INTO notifications (id, user_id, email, title, subject, message, html_content, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'EMAIL')
      `).run(
        crypto.randomUUID(),
        senderUserId,
        req.user.email,
        "Debit Alert",
        `Debit Alert: Sent $${transferAmount.toFixed(2)} to ${recipient.full_name}`,
        `Sent $${transferAmount.toFixed(2)} to ${recipient.full_name} (${recipient.account_number}). Ref: ${refId}.`,
        senderEmailHtml
      );

      // 5. Recipient Email Alert
      db.prepare(`
        INSERT INTO notifications (id, user_id, email, title, subject, message, html_content, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'EMAIL')
      `).run(
        crypto.randomUUID(),
        recipient.user_id,
        recipient.email,
        "Credit Alert",
        `Credit Alert: Received $${transferAmount.toFixed(2)} from ${req.user.full_name}`,
        `Received $${transferAmount.toFixed(2)} from ${req.user.full_name}. Ref: ${refId}.`,
        recipientEmailHtml
      );
    });

    return res.created(
      {
        reference_id: refId,
        amount: transferAmount,
        recipient_name: recipient.full_name,
        recipient_account: recipient.account_number,
        description,
        status: "COMPLETED",
        new_balance: senderNewBalance,
      },
      "Internal transfer completed successfully"
    );
  });

  /**
   * POST /external/initiate
   * Stage an external wire transfer and send clean HTML OTP email
   */
  api.post("/external/initiate", { intercept: requireAuth }, (req, res) => {
    const {
      bank_name,
      routing_number,
      account_number,
      beneficiary_name,
      amount,
      description = "External Wire Transfer",
    } = req.body || {};

    const transferAmount = Number(amount);
    if (!bank_name || !routing_number || !account_number || !beneficiary_name || isNaN(transferAmount) || transferAmount <= 0) {
      return res.badRequest("All external bank details and a valid transfer amount are required");
    }

    const senderAccountId = req.account.id;
    const sender = db.prepare("SELECT balance, is_frozen FROM accounts WHERE id = ?").get(senderAccountId);

    if (sender.is_frozen === 1) {
      return res.badRequest("Your account is currently frozen");
    }

    const EXTERNAL_FEE = 2.50; // Standard simulated wire fee
    const totalRequired = transferAmount + EXTERNAL_FEE;

    if (sender.balance < totalRequired) {
      return res.badRequest(
        `Insufficient balance for transfer + fee ($${EXTERNAL_FEE.toFixed(2)}). Total needed: $${totalRequired.toFixed(2)}, Available: $${sender.balance.toFixed(2)}`
      );
    }

    const refId = generateReferenceId("EXT");
    const otpCode = generateOtpCode();
    const codeHash = hashOtp(otpCode);
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString(); // 3 minutes validity

    const externalDetails = JSON.stringify({
      bank_name: bank_name.trim(),
      routing_number: routing_number.trim(),
      account_number: account_number.trim(),
      beneficiary_name: beneficiary_name.trim(),
    });

    const emailHtml = generateWireOtpEmailHtml({
      fullName: req.user.full_name,
      otpCode,
      amount: transferAmount,
      fee: EXTERNAL_FEE,
      bankName: bank_name.trim(),
      beneficiaryName: beneficiary_name.trim(),
      referenceId: refId,
      expiresInMinutes: 3,
    });

    const emailText = generateWireOtpPlainText({
      fullName: req.user.full_name,
      otpCode,
      amount: transferAmount,
      bankName: bank_name.trim(),
      beneficiaryName: beneficiary_name.trim(),
      referenceId: refId,
      expiresInMinutes: 3,
    });

    transaction(() => {
      // 1. Stage transfer in PENDING_OTP status
      db.prepare(`
        INSERT INTO transactions (
          id, reference_id, sender_account_id, type, amount, fee, status, external_bank_details, description
        ) VALUES (?, ?, ?, 'EXTERNAL', ?, ?, 'PENDING_OTP', ?, ?)
      `).run(
        crypto.randomUUID(),
        refId,
        senderAccountId,
        transferAmount,
        EXTERNAL_FEE,
        externalDetails,
        description
      );

      // 2. Generate OTP Token linked to email
      db.prepare(`
        INSERT INTO otp_tokens (
          id, user_id, email, code_hash, purpose, reference_id, expires_at
        ) VALUES (?, ?, ?, ?, 'EXTERNAL_TRANSFER', ?, ?)
      `).run(
        crypto.randomUUID(),
        req.user.id,
        req.user.email,
        codeHash,
        refId,
        expiresAt
      );

      // 3. Queue Clean Security Email Notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, email, title, subject, message, html_content, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'EMAIL')
      `).run(
        crypto.randomUUID(),
        req.user.id,
        req.user.email,
        "Nova Bank Security Passcode",
        "Your Security Passcode — Nova Bank",
        emailText,
        emailHtml
      );
    });

    return res.success({
      reference_id: refId,
      masked_email: maskEmail(req.user.email),
      email: req.user.email,
      amount: transferAmount,
      fee: EXTERNAL_FEE,
      total_amount: totalRequired,
      bank_name,
      beneficiary_name,
      expires_in_seconds: 180,
      simulated_otp_hint: otpCode, // convenient testing hint
    });
  });

  /**
   * POST /external/verify
   * Validates OTP and completes the external transfer
   */
  api.post("/external/verify", { intercept: [requireAuth, otpLimiter] }, (req, res) => {
    const { reference_id, otp_code } = req.body || {};

    if (!reference_id || !otp_code) {
      return res.badRequest("Transaction reference ID and OTP code are required");
    }

    const cleanOtp = String(otp_code).trim();
    const senderAccountId = req.account.id;

    // Retrieve pending transaction
    const tx = db.prepare(`
      SELECT * FROM transactions 
      WHERE reference_id = ? AND sender_account_id = ? AND status = 'PENDING_OTP'
    `).get(reference_id, senderAccountId);

    if (!tx) {
      return res.badRequest("No pending transfer found for this reference code");
    }

    // Retrieve OTP token
    const token = db.prepare(`
      SELECT * FROM otp_tokens 
      WHERE reference_id = ? AND user_id = ?
      ORDER BY rowid DESC LIMIT 1
    `).get(reference_id, req.user.id);

    if (!token) {
      return res.badRequest("No active OTP token found for this transaction");
    }

    if (token.verified === 1) {
      return res.badRequest("This OTP code has already been used");
    }

    if (new Date() > new Date(token.expires_at)) {
      return res.badRequest("This OTP code has expired. Please request a new one.");
    }

    if (token.attempts >= token.max_attempts) {
      return res.badRequest("Maximum attempts exceeded. This transfer request has been canceled for security.");
    }

    // Verify OTP hash
    const inputHash = hashOtp(cleanOtp);
    if (inputHash !== token.code_hash) {
      db.prepare("UPDATE otp_tokens SET attempts = attempts + 1 WHERE id = ?").run(token.id);
      const remaining = token.max_attempts - (token.attempts + 1);
      return res.badRequest(`Invalid OTP code. ${remaining > 0 ? `${remaining} attempts remaining.` : "Transfer locked."}`);
    }

    // Code matches! Re-check balance and deduct atomically
    const sender = db.prepare("SELECT balance FROM accounts WHERE id = ?").get(senderAccountId);
    const totalDeduction = tx.amount + tx.fee;

    if (sender.balance < totalDeduction) {
      return res.badRequest("Insufficient funds to complete transfer");
    }

    const newBalance = sender.balance - totalDeduction;

    let external = {};
    try { external = JSON.parse(tx.external_bank_details); } catch {}

    const confirmationHtml = generateTransactionAlertHtml({
      fullName: req.user.full_name,
      type: "DEBIT",
      amount: tx.amount,
      counterparty: `${external.beneficiary_name || "Beneficiary"} (${external.bank_name || "External Bank"})`,
      referenceId: reference_id,
      newBalance,
    });

    transaction(() => {
      // 1. Mark OTP verified
      db.prepare("UPDATE otp_tokens SET verified = 1 WHERE id = ?").run(token.id);

      // 2. Deduct balance from sender
      db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(totalDeduction, senderAccountId);

      // 3. Mark transaction COMPLETED
      db.prepare("UPDATE transactions SET status = 'COMPLETED' WHERE id = ?").run(tx.id);

      // 4. Outgoing Debit Email Alert
      db.prepare(`
        INSERT INTO notifications (id, user_id, email, title, subject, message, html_content, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'EMAIL')
      `).run(
        crypto.randomUUID(),
        req.user.id,
        req.user.email,
        "Wire Transfer Sent",
        `Wire Transfer Processed: $${tx.amount.toFixed(2)} to ${external.beneficiary_name || "Beneficiary"}`,
        `External wire of $${tx.amount.toFixed(2)} to ${external.beneficiary_name || "Beneficiary"} (${external.bank_name || "External Bank"}) has been processed. Ref: ${reference_id}.`,
        confirmationHtml
      );
    });

    return res.success(
      {
        reference_id,
        amount: tx.amount,
        fee: tx.fee,
        total_deducted: totalDeduction,
        status: "COMPLETED",
        new_balance: newBalance,
      },
      "External transfer authorized and completed successfully"
    );
  });

  /**
   * POST /external/resend-otp
   * Generates a fresh OTP email for a pending external transfer
   */
  api.post("/external/resend-otp", { intercept: requireAuth }, (req, res) => {
    const { reference_id } = req.body || {};
    if (!reference_id) {
      return res.badRequest("Transaction reference ID is required");
    }

    const tx = db.prepare(`
      SELECT * FROM transactions 
      WHERE reference_id = ? AND sender_account_id = ? AND status = 'PENDING_OTP'
    `).get(reference_id, req.account.id);

    if (!tx) {
      return res.badRequest("No pending transfer found for this reference");
    }

    const newOtp = generateOtpCode();
    const newHash = hashOtp(newOtp);
    const newExpiry = new Date(Date.now() + 3 * 60 * 1000).toISOString();

    let external = {};
    try { external = JSON.parse(tx.external_bank_details); } catch {}

    const emailHtml = generateWireOtpEmailHtml({
      fullName: req.user.full_name,
      otpCode: newOtp,
      amount: tx.amount,
      fee: tx.fee,
      bankName: external.bank_name || "External Bank",
      beneficiaryName: external.beneficiary_name || "Beneficiary",
      referenceId: reference_id,
      expiresInMinutes: 3,
    });

    const emailText = generateWireOtpPlainText({
      fullName: req.user.full_name,
      otpCode: newOtp,
      amount: tx.amount,
      bankName: external.bank_name || "External Bank",
      beneficiaryName: external.beneficiary_name || "Beneficiary",
      referenceId: reference_id,
      expiresInMinutes: 3,
    });

    transaction(() => {
      // Invalidate previous tokens
      db.prepare("UPDATE otp_tokens SET attempts = max_attempts WHERE reference_id = ?").run(reference_id);

      // Insert fresh token
      db.prepare(`
        INSERT INTO otp_tokens (
          id, user_id, email, code_hash, purpose, reference_id, expires_at
        ) VALUES (?, ?, ?, ?, 'EXTERNAL_TRANSFER', ?, ?)
      `).run(
        crypto.randomUUID(),
        req.user.id,
        req.user.email,
        newHash,
        reference_id,
        newExpiry
      );

      // Send new Email notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, email, title, subject, message, html_content, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'EMAIL')
      `).run(
        crypto.randomUUID(),
        req.user.id,
        req.user.email,
        "New Security Passcode",
        "Your Replacement Passcode — Nova Bank",
        emailText,
        emailHtml
      );
    });

    return res.success(
      {
        reference_id,
        masked_email: maskEmail(req.user.email),
        simulated_otp_hint: newOtp,
        expires_in_seconds: 180,
      },
      "New OTP sent to your registered email address"
    );
  });
}
