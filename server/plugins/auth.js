import bcrypt from "bcryptjs";
import crypto from "crypto";
import { rateLimit } from "vibe-gx";
import { db, transaction } from "../db/index.js";
import { generateToken, requireAuth } from "../middleware/auth.js";
import { sendEmail } from "../utils/mailer.js";
import {
  generateAccountNumber,
  DEFAULT_ROUTING_NUMBER,
  generateCardDetails,
  generateOtpCode,
  hashOtp,
  generateWelcomeEmailHtml,
  generateWelcomePlainText,
  generateEmailVerificationHtml,
  generateEmailVerificationPlainText,
} from "../utils/helpers.js";

/** How long (days) before an unverified account is auto-dormanted */
export const DORMANCY_DAYS = 14;

/** OTP validity window for email verification (minutes) */
const EMAIL_OTP_EXPIRY_MINUTES = 10;

export default async function authPlugin(api) {
  // Rate limiters
  const loginLimiter = rateLimit({
    max: 10,
    window: 60_000,
    message: "Too many login attempts. Please wait 60 seconds.",
  });

  const registerLimiter = rateLimit({
    max: 5,
    window: 60_000,
    message: "Too many registration attempts. Please wait 60 seconds.",
  });

  const resendLimiter = rateLimit({
    max: 3,
    window: 60_000,
    message: "Too many resend requests. Please wait 60 seconds.",
  });

  /**
   * POST /register
   * Single-step: creates user + account immediately, sends verification OTP via
   * Resend, and returns a session token so the user can start using the app.
   * Account becomes dormant if email is not verified within DORMANCY_DAYS days.
   */
  api.post("/register", { intercept: registerLimiter }, async (req, res) => {
    const { full_name, email, password } = req.body || {};

    if (!full_name || !email || !password) {
      return res.badRequest("Full name, email, and password are required");
    }

    if (password.length < 6) {
      return res.badRequest("Password must be at least 6 characters");
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(cleanEmail);
    if (existing) {
      return res.conflict("An account with this email address already exists");
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const userId = crypto.randomUUID();
    const accountId = crypto.randomUUID();
    const accountNumber = generateAccountNumber();
    const starterBalance = 0.00;

    const welcomeHtml = generateWelcomeEmailHtml({
      fullName: full_name.trim(),
      accountNumber,
      routingNumber: DEFAULT_ROUTING_NUMBER,
      initialBalance: starterBalance,
    });
    const welcomeText = generateWelcomePlainText({
      fullName: full_name.trim(),
      accountNumber,
      routingNumber: DEFAULT_ROUTING_NUMBER,
      initialBalance: starterBalance,
    });

    // Generate a fresh email verification OTP
    const otpCode = generateOtpCode();
    const otpExpiresAt = new Date(Date.now() + EMAIL_OTP_EXPIRY_MINUTES * 60 * 1000)
      .toISOString().replace("T", " ").slice(0, 19);

    // ACID: create user, account, in-app welcome notification, verification OTP & notification
    const verifyHtml = generateEmailVerificationHtml({
      fullName: full_name.trim(),
      otpCode,
      expiresInMinutes: EMAIL_OTP_EXPIRY_MINUTES,
    });
    const verifyText = generateEmailVerificationPlainText({
      fullName: full_name.trim(),
      otpCode,
      expiresInMinutes: EMAIL_OTP_EXPIRY_MINUTES,
    });

    transaction(() => {
      db.prepare(`
        INSERT INTO users (id, full_name, email, phone_number, password_hash, email_verified)
        VALUES (?, ?, ?, NULL, ?, 0)
      `).run(userId, full_name.trim(), cleanEmail, password_hash);

      db.prepare(`
        INSERT INTO accounts (
          id, user_id, account_number, routing_number, account_type,
          balance, currency, card_number, card_cvv, card_expiry, card_status
        ) VALUES (?, ?, ?, ?, 'CHECKING', ?, 'USD', '', '', '', 'NONE')
      `).run(accountId, userId, accountNumber, DEFAULT_ROUTING_NUMBER, starterBalance);

      // 1. Welcome notification in the in-app inbox
      db.prepare(`
        INSERT INTO notifications (id, user_id, email, title, subject, message, html_content, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'EMAIL')
      `).run(crypto.randomUUID(), userId, cleanEmail,
        "Welcome to First Horizon Bank",
        "Welcome to First Horizon Bank — Your Account is Ready",
        welcomeText, welcomeHtml);

      // 2. Email verification notification in the in-app inbox (accessible via Virtual Inbox Drawer)
      db.prepare(`
        INSERT INTO notifications (id, user_id, email, title, subject, message, html_content, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'EMAIL')
      `).run(crypto.randomUUID(), userId, cleanEmail,
        "Verify Your Email Address",
        "Verify Your First Horizon Bank Email Address",
        verifyText, verifyHtml);

      // 3. Email verification OTP stored in otp_tokens (purpose = EMAIL_VERIFICATION)
      db.prepare(`
        INSERT INTO otp_tokens (id, user_id, email, code_hash, purpose, reference_id, expires_at)
        VALUES (?, ?, ?, ?, 'EMAIL_VERIFICATION', 'email-verify', ?)
      `).run(crypto.randomUUID(), userId, cleanEmail, hashOtp(otpCode), otpExpiresAt);
    });

    // Send welcome + verification emails via Resend (non-blocking)
    sendEmail({
      to: cleanEmail,
      subject: "Verify your First Horizon Bank email address",
      html: verifyHtml,
      text: verifyText,
    }).catch((err) => console.error("[Resend] Verification email failed:", err?.message));

    sendEmail({
      to: cleanEmail,
      subject: "Welcome to First Horizon Bank — Your Account is Ready",
      html: welcomeHtml,
      text: welcomeText,
    }).catch((err) => console.error("[Resend] Welcome email failed:", err?.message));

    const user = { id: userId, full_name: full_name.trim(), email: cleanEmail, role: "CUSTOMER" };
    const token = generateToken(user);

    return res.created(
      {
        token,
        user: { ...user, email_verified: 0, is_dormant: 0 },
        account: {
          id: accountId,
          account_number: accountNumber,
          routing_number: DEFAULT_ROUTING_NUMBER,
          balance: starterBalance,
          currency: "USD",
          card_number: "",
          card_cvv: "",
          card_expiry: "",
          card_status: "NONE",
          is_frozen: 0,
        },
      },
      "Account created. Please verify your email within 14 days to keep your account active."
    );
  });

  /**
   * POST /login
   * Authenticate customer. Auto-dormants accounts past the 14-day window.
   */
  api.post("/login", { intercept: loginLimiter }, async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.badRequest("Email and password are required");
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare(`
      SELECT id, full_name, email, role, admin_role, password_hash, created_at,
             email_verified, is_dormant
      FROM users WHERE email = ?
    `).get(cleanEmail);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.badRequest("Invalid email or password");
    }

    // Auto-dormant if past 14-day window and still unverified
    if (!user.email_verified && !user.is_dormant) {
      const createdAt = new Date(user.created_at.includes("T") ? user.created_at : user.created_at + "Z");
      const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation >= DORMANCY_DAYS) {
        const dormantAt = new Date().toISOString().replace("T", " ").slice(0, 19);
        db.prepare("UPDATE users SET is_dormant = 1, dormant_at = ? WHERE id = ?")
          .run(dormantAt, user.id);
        user.is_dormant = 1;
      }
    }

    if (user.is_dormant) {
      return res.status(403).json({
        success: false,
        error: "Your account is dormant due to an unverified email address. Please contact First Horizon support to reactivate.",
        code: "ACCOUNT_DORMANT",
      });
    }

    const account = db.prepare(`
      SELECT id, account_number, routing_number, account_type, balance, currency,
             card_number, card_cvv, card_expiry, card_status, is_frozen
      FROM accounts WHERE user_id = ?
    `).get(user.id);

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role || "CUSTOMER",
      admin_role: user.admin_role || (user.role === "ADMIN" ? (user.email === "admin@novabank.com" ? "SUPER_ADMIN" : "LIMITED_ADMIN") : null),
      email_verified: user.email_verified,
      is_dormant: user.is_dormant,
      created_at: user.created_at,
    };

    return res.success({ token: generateToken(safeUser), user: safeUser, account }, "Login successful");
  });

  /**
   * GET /me
   * Fetches current logged-in customer profile & account status.
   */
  api.get("/me", { intercept: requireAuth }, (req, res) => {
    return res.success({ user: req.user, account: req.account });
  });

  /**
   * POST /verify-email  (authenticated)
   * Verifies the 6-digit OTP sent to the user's email on signup.
   */
  api.post("/verify-email", { intercept: requireAuth }, (req, res) => {
    const { otp_code } = req.body || {};

    if (!otp_code) {
      return res.badRequest("otp_code is required");
    }

    if (req.user.email_verified) {
      return res.success({ email_verified: true }, "Email is already verified");
    }

    const submittedHash = hashOtp(otp_code.trim());

    // Find the most recent active EMAIL_VERIFICATION token for this user
    const token = db.prepare(`
      SELECT id, code_hash, expires_at, verified, attempts, max_attempts
      FROM otp_tokens
      WHERE user_id = ? AND purpose = 'EMAIL_VERIFICATION' AND verified = 0
      ORDER BY created_at DESC LIMIT 1
    `).get(req.user.id);

    if (!token) {
      return res.badRequest("No active verification code found. Please request a new one.");
    }

    // Check expiry
    const expiresAt = new Date(token.expires_at.includes("T") ? token.expires_at : token.expires_at + "Z");
    if (expiresAt < new Date()) {
      return res.badRequest("Verification code has expired. Please request a new one.");
    }

    // Check attempts
    if (token.attempts >= token.max_attempts) {
      return res.badRequest("Too many incorrect attempts. Please request a new code.");
    }

    if (submittedHash !== token.code_hash) {
      db.prepare("UPDATE otp_tokens SET attempts = attempts + 1 WHERE id = ?").run(token.id);
      const remaining = token.max_attempts - token.attempts - 1;
      return res.badRequest(`Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
    }

    // ✅ OTP matched — mark email as verified and clear dormancy if present
    const verifiedAt = new Date().toISOString().replace("T", " ").slice(0, 19);
    transaction(() => {
      db.prepare("UPDATE otp_tokens SET verified = 1 WHERE id = ?").run(token.id);
      db.prepare(`
        UPDATE users 
        SET email_verified = 1, email_verified_at = ?, is_dormant = 0, dormant_at = NULL 
        WHERE id = ?
      `).run(verifiedAt, req.user.id);

      db.prepare(`
        INSERT INTO notifications (id, user_id, email, title, subject, message, type)
        VALUES (?, ?, ?, 'Email Address Verified', 'Security Confirmation: Email Verified',
                'Your email address has been verified. Your First Horizon account is in full active standing.', 'EMAIL')
      `).run(crypto.randomUUID(), req.user.id, req.user.email);
    });

    return res.success({ email_verified: true, is_dormant: 0 }, "Email verified successfully. Your account is fully active.");
  });

  /**
   * POST /resend-verification  (authenticated)
   * Generates a new OTP and sends a fresh verification email via Resend & in-app notifications.
   */
  api.post("/resend-verification", { intercept: [requireAuth, resendLimiter] }, async (req, res) => {
    if (req.user.email_verified) {
      return res.success({ email_verified: true }, "Email is already verified");
    }

    // Invalidate old tokens for this user
    db.prepare(`
      UPDATE otp_tokens SET verified = 1
      WHERE user_id = ? AND purpose = 'EMAIL_VERIFICATION' AND verified = 0
    `).run(req.user.id);

    const otpCode = generateOtpCode();
    const otpExpiresAt = new Date(Date.now() + EMAIL_OTP_EXPIRY_MINUTES * 60 * 1000)
      .toISOString().replace("T", " ").slice(0, 19);

    const verifyHtml = generateEmailVerificationHtml({
      fullName: req.user.full_name,
      otpCode,
      expiresInMinutes: EMAIL_OTP_EXPIRY_MINUTES,
    });
    const verifyText = generateEmailVerificationPlainText({
      fullName: req.user.full_name,
      otpCode,
      expiresInMinutes: EMAIL_OTP_EXPIRY_MINUTES,
    });

    // Save token and in-app notification
    transaction(() => {
      db.prepare(`
        INSERT INTO otp_tokens (id, user_id, email, code_hash, purpose, reference_id, expires_at)
        VALUES (?, ?, ?, ?, 'EMAIL_VERIFICATION', 'email-verify', ?)
      `).run(crypto.randomUUID(), req.user.id, req.user.email, hashOtp(otpCode), otpExpiresAt);

      db.prepare(`
        INSERT INTO notifications (id, user_id, email, title, subject, message, html_content, type)
        VALUES (?, ?, ?, 'New Verification Code', 'Your First Horizon Verification Code', ?, ?, 'EMAIL')
      `).run(crypto.randomUUID(), req.user.id, req.user.email, verifyText, verifyHtml);
    });

    // Send via Resend
    sendEmail({
      to: req.user.email,
      subject: "Your new First Horizon email verification code",
      html: verifyHtml,
      text: verifyText,
    }).catch((err) => console.error("[Resend] Resend verification failed:", err?.message));

    return res.success({}, `A new verification code has been sent to ${req.user.email}`);
  });

  /**
   * POST /reactivate-dormant  (public)
   * Allows an unauthenticated customer with a dormant unverified account to submit
   * their email + OTP code to verify their address, lift dormancy, and receive a session token.
   */
  api.post("/reactivate-dormant", async (req, res) => {
    const { email, otp_code } = req.body || {};
    if (!email || !otp_code) {
      return res.badRequest("Email and 6-digit verification code are required");
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(cleanEmail);
    if (!user) {
      return res.badRequest("Account not found");
    }

    const token = db.prepare(`
      SELECT id, code_hash, expires_at, verified, attempts, max_attempts
      FROM otp_tokens
      WHERE user_id = ? AND purpose = 'EMAIL_VERIFICATION' AND verified = 0
      ORDER BY created_at DESC LIMIT 1
    `).get(user.id);

    if (!token) {
      return res.badRequest("No active verification code found. Please request a new code.");
    }

    const expiresAt = new Date(token.expires_at.includes("T") ? token.expires_at : token.expires_at + "Z");
    if (expiresAt < new Date()) {
      return res.badRequest("Verification code has expired. Please request a new code.");
    }

    if (token.attempts >= token.max_attempts) {
      return res.badRequest("Too many incorrect attempts. Please request a new code.");
    }

    const submittedHash = hashOtp(otp_code.trim());
    if (submittedHash !== token.code_hash) {
      db.prepare("UPDATE otp_tokens SET attempts = attempts + 1 WHERE id = ?").run(token.id);
      const remaining = token.max_attempts - token.attempts - 1;
      return res.badRequest(`Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
    }

    // Lift dormancy and mark email verified
    const verifiedAt = new Date().toISOString().replace("T", " ").slice(0, 19);
    transaction(() => {
      db.prepare("UPDATE otp_tokens SET verified = 1 WHERE id = ?").run(token.id);
      db.prepare(`
        UPDATE users 
        SET email_verified = 1, email_verified_at = ?, is_dormant = 0, dormant_at = NULL 
        WHERE id = ?
      `).run(verifiedAt, user.id);
    });

    const account = db.prepare(`
      SELECT id, account_number, routing_number, account_type, balance, currency,
             card_number, card_cvv, card_expiry, card_status, is_frozen
      FROM accounts WHERE user_id = ?
    `).get(user.id);

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role || "CUSTOMER",
      admin_role: user.admin_role || (user.role === "ADMIN" ? (user.email === "admin@novabank.com" ? "SUPER_ADMIN" : "LIMITED_ADMIN") : null),
      email_verified: 1,
      is_dormant: 0,
      created_at: user.created_at,
    };

    return res.success(
      { token: generateToken(safeUser), user: safeUser, account },
      "Account successfully verified and reactivated! Welcome back."
    );
  });

  /**
   * POST /resend-dormant-code  (public)
   * Sends a fresh verification code to an unverified/dormant account email.
   */
  api.post("/resend-dormant-code", { intercept: resendLimiter }, async (req, res) => {
    const { email } = req.body || {};
    if (!email) return res.badRequest("Email is required");

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(cleanEmail);
    if (!user) {
      // Return generic response to prevent email enumeration
      return res.success({}, "If an account matches this email, a verification code has been dispatched.");
    }

    // Invalidate old tokens
    db.prepare(`
      UPDATE otp_tokens SET verified = 1
      WHERE user_id = ? AND purpose = 'EMAIL_VERIFICATION' AND verified = 0
    `).run(user.id);

    const otpCode = generateOtpCode();
    const otpExpiresAt = new Date(Date.now() + EMAIL_OTP_EXPIRY_MINUTES * 60 * 1000)
      .toISOString().replace("T", " ").slice(0, 19);

    const verifyHtml = generateEmailVerificationHtml({
      fullName: user.full_name,
      otpCode,
      expiresInMinutes: EMAIL_OTP_EXPIRY_MINUTES,
    });
    const verifyText = generateEmailVerificationPlainText({
      fullName: user.full_name,
      otpCode,
      expiresInMinutes: EMAIL_OTP_EXPIRY_MINUTES,
    });

    transaction(() => {
      db.prepare(`
        INSERT INTO otp_tokens (id, user_id, email, code_hash, purpose, reference_id, expires_at)
        VALUES (?, ?, ?, ?, 'EMAIL_VERIFICATION', 'email-verify', ?)
      `).run(crypto.randomUUID(), user.id, user.email, hashOtp(otpCode), otpExpiresAt);

      db.prepare(`
        INSERT INTO notifications (id, user_id, email, title, subject, message, html_content, type)
        VALUES (?, ?, ?, 'Verification Code (Reactivation)', 'Your First Horizon Verification Code', ?, ?, 'EMAIL')
      `).run(crypto.randomUUID(), user.id, user.email, verifyText, verifyHtml);
    });

    sendEmail({
      to: user.email,
      subject: "Your First Horizon reactivation verification code",
      html: verifyHtml,
      text: verifyText,
    }).catch((err) => console.error("[Resend] Resend dormant code failed:", err?.message));

    return res.success({}, `A verification code has been sent to ${cleanEmail}`);
  });
}

// Startup check: sweep and dormant any unverified accounts past 14 days
try {
  const sweep = db.prepare(`
    UPDATE users
    SET is_dormant = 1, dormant_at = datetime('now')
    WHERE email_verified = 0
      AND is_dormant = 0
      AND role = 'CUSTOMER'
      AND datetime(created_at, '+14 days') <= datetime('now')
  `).run();
  if (sweep.changes > 0) {
    console.log(`🏦 [Dormancy] Sweep completed: ${sweep.changes} unverified account(s) older than 14 days marked dormant.`);
  }
} catch (e) {
  console.warn("Notice: Dormancy startup check:", e.message);
}
