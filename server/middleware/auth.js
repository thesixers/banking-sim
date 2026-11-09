import jwt from "jsonwebtoken";
import { db } from "../db/index.js";

export const JWT_SECRET = process.env.JWT_SECRET || "banking-simulator-super-secret-key-2026";

/**
 * Generate a JWT token for a user
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || "CUSTOMER",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Vibe Interceptor to authenticate requests via Bearer token.
 * Also blocks dormant accounts and surfaces email_verified status.
 */
export function requireAuth(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.unauthorized("Authentication token required");
  }

  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch fresh user & account details from SQLite (includes verification fields)
    const user = db.prepare(`
      SELECT id, full_name, email, role, admin_role, phone_number, created_at,
             email_verified, email_verified_at, is_dormant, dormant_at
      FROM users
      WHERE id = ?
    `).get(decoded.id);

    if (!user) {
      return res.unauthorized("User account no longer exists");
    }

    // Auto-dormant check: if unverified and account is 14+ days old, mark dormant
    if (!user.email_verified && !user.is_dormant && user.role !== "ADMIN" && user.created_at) {
      const createdDate = new Date(user.created_at.includes("T") ? user.created_at : user.created_at + "Z");
      const daysOld = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysOld >= 14) {
        const dormantAt = new Date().toISOString().replace("T", " ").slice(0, 19);
        db.prepare("UPDATE users SET is_dormant = 1, dormant_at = ? WHERE id = ?").run(dormantAt, user.id);
        user.is_dormant = 1;
        user.dormant_at = dormantAt;
      }
    }

    // Block dormant accounts from authenticated routes (except email verification routes to allow self-reactivation)
    if (user.is_dormant) {
      const url = req.url || "";
      const isVerificationRoute = url.includes("/verify-email") || url.includes("/resend-verification");
      if (!isVerificationRoute) {
        return res.status(403).json({
          success: false,
          error: "Your account is dormant due to an unverified email address after 14 days. Please verify your email or contact First Horizon support to reactivate.",
          code: "ACCOUNT_DORMANT",
        });
      }
    }

    const account = db.prepare(`
      SELECT id, account_number, routing_number, account_type, balance, currency, card_number, card_cvv, card_expiry, card_status, card_applied_at, is_frozen
      FROM accounts
      WHERE user_id = ?
    `).get(user.id);

    // Attach to request
    req.user = user;
    req.account = account;
  } catch (error) {
    return res.unauthorized("Invalid or expired session token");
  }
}

/**
 * Interceptor ensuring caller is authenticated and has ADMIN privileges
 */
export function requireAdmin(req, res) {
  const authErr = requireAuth(req, res);
  if (authErr) return authErr;

  if (req.user?.role !== "ADMIN") {
    return res.forbidden("Access denied: Administrative privileges required");
  }
}

/**
 * Interceptor ensuring caller is a Master / Super Administrator
 */
export function requireSuperAdmin(req, res) {
  const authErr = requireAdmin(req, res);
  if (authErr) return authErr;

  const isSuper = req.user?.admin_role === "SUPER_ADMIN" || req.user?.email === "admin@novabank.com";
  if (!isSuper) {
    return res.forbidden("Access denied: Master Administrator privileges required for this action");
  }
}
