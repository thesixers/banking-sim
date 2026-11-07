import bcrypt from "bcryptjs";
import crypto from "crypto";
import { rateLimit } from "vibe-gx";
import { db, transaction } from "../db/index.js";
import { generateToken, requireAuth } from "../middleware/auth.js";
import {
  generateAccountNumber,
  DEFAULT_ROUTING_NUMBER,
  generateCardDetails,
  generateReferenceId,
  generateWelcomeEmailHtml,
  generateWelcomePlainText,
} from "../utils/helpers.js";

export default async function authPlugin(api) {
  // Login rate limiter: 10 attempts per minute
  const loginLimiter = rateLimit({
    max: 10,
    window: 60_000,
    message: "Too many login attempts. Please wait 60 seconds.",
  });

  /**
   * POST /register
   * Creates a new banking customer, provisions checking account & virtual card
   * Email-first: phone number is completely optional / not required
   */
  api.post("/register", async (req, res) => {
    const { full_name, email, password } = req.body || {};

    if (!full_name || !email || !password) {
      return res.badRequest("Full name, email, and password are required");
    }

    if (password.length < 6) {
      return res.badRequest("Password must be at least 6 characters");
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email only
    const existing = db.prepare(`
      SELECT id, email FROM users 
      WHERE email = ?
    `).get(cleanEmail);

    if (existing) {
      return res.conflict("An account with this email address already exists");
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const userId = crypto.randomUUID();
    const accountId = crypto.randomUUID();
    const accountNumber = generateAccountNumber();
    const card = generateCardDetails();
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

    // ACID creation of user, account, and welcome notification
    transaction(() => {
      // 1. Insert user (phone_number is NULL)
      db.prepare(`
        INSERT INTO users (id, full_name, email, phone_number, password_hash)
        VALUES (?, ?, ?, NULL, ?)
      `).run(userId, full_name.trim(), cleanEmail, password_hash);

      // 2. Insert checking account with 0.00 starting balance
      db.prepare(`
        INSERT INTO accounts (
          id, user_id, account_number, routing_number, account_type, 
          balance, currency, card_number, card_cvv, card_expiry
        ) VALUES (?, ?, ?, ?, 'CHECKING', ?, 'USD', ?, ?, ?)
      `).run(
        accountId,
        userId,
        accountNumber,
        DEFAULT_ROUTING_NUMBER,
        starterBalance,
        card.cardNumber,
        card.cvv,
        card.expiry
      );

      // 3. Initial welcome Email notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, email, title, subject, message, html_content, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'EMAIL')
      `).run(
        crypto.randomUUID(),
        userId,
        cleanEmail,
        "Welcome to Nova Bank",
        "Welcome to Nova Bank — Your Account is Ready",
        welcomeText,
        welcomeHtml
      );
    });

    const user = {
      id: userId,
      full_name: full_name.trim(),
      email: cleanEmail,
      role: "CUSTOMER",
    };

    const token = generateToken(user);

    return res.created(
      {
        token,
        user,
        account: {
          id: accountId,
          account_number: accountNumber,
          routing_number: DEFAULT_ROUTING_NUMBER,
          balance: starterBalance,
          currency: "USD",
          card_number: card.cardNumber,
          card_cvv: card.cvv,
          card_expiry: card.expiry,
          is_frozen: 0,
        },
      },
      "Account registered successfully"
    );
  });

  /**
   * POST /login
   * Authenticate customer with email and password
   */
  api.post("/login", { intercept: loginLimiter }, async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.badRequest("Email and password are required");
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare(`
      SELECT id, full_name, email, role, password_hash, created_at
      FROM users
      WHERE email = ?
    `).get(cleanEmail);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.badRequest("Invalid email or password");
    }

    const account = db.prepare(`
      SELECT id, account_number, routing_number, account_type, balance, currency, card_number, card_cvv, card_expiry, is_frozen
      FROM accounts
      WHERE user_id = ?
    `).get(user.id);

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role || "CUSTOMER",
      created_at: user.created_at,
    };

    const token = generateToken(safeUser);

    return res.success(
      {
        token,
        user: safeUser,
        account,
      },
      "Login successful"
    );
  });

  /**
   * GET /me
   * Fetches the current logged in customer's profile & account status
   */
  api.get("/me", { intercept: requireAuth }, (req, res) => {
    return res.success({
      user: req.user,
      account: req.account,
    });
  });
}
