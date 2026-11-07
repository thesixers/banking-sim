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
 * Vibe Interceptor to authenticate requests via Bearer token
 */
export function requireAuth(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.unauthorized("Authentication token required");
  }

  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch fresh user & account details from SQLite
    const user = db.prepare(`
      SELECT id, full_name, email, role, phone_number, created_at 
      FROM users 
      WHERE id = ?
    `).get(decoded.id);

    if (!user) {
      return res.unauthorized("User account no longer exists");
    }

    const account = db.prepare(`
      SELECT id, account_number, routing_number, account_type, balance, currency, card_number, card_cvv, card_expiry, is_frozen
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
