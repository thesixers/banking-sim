import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "banking.db");
export const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for high concurrency
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");

// Initialize Schema
const schemaPath = path.join(__dirname, "schema.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf-8");
db.exec(schemaSql);

// Migration: Ensure role column exists on users
try {
  const userColumns = db.prepare("PRAGMA table_info(users)").all();
  const hasRole = userColumns.some((col) => col.name === "role");
  if (!hasRole) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'CUSTOMER';");
  }
} catch (e) {
  console.warn("Migration warning for users.role:", e.message);
}

// Seed Master Administrator Account if not present
try {
  const adminEmail = "admin@novabank.com";
  const existingAdmin = db.prepare("SELECT id FROM users WHERE email = ?").get(adminEmail);
  if (!existingAdmin) {
    const adminId = "admin-master-system-001";
    const accountId = "admin-master-account-001";
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync("admin123", salt);

    db.exec("BEGIN IMMEDIATE;");
    db.prepare(`
      INSERT INTO users (id, full_name, email, phone_number, password_hash, role)
      VALUES (?, 'Nova Bank Master Administrator', ?, NULL, ?, 'ADMIN')
    `).run(adminId, adminEmail, passwordHash);

    db.prepare(`
      INSERT INTO accounts (
        id, user_id, account_number, routing_number, account_type,
        balance, currency, card_number, card_cvv, card_expiry, is_frozen
      ) VALUES (?, ?, '1000000000', '021000021', 'TREASURY', 1000000.00, 'USD', '4532 9999 8888 7777', '999', '12/99', 0)
    `).run(accountId, adminId);
    db.exec("COMMIT;");
  }
} catch (e) {
  try { db.exec("ROLLBACK;"); } catch {}
  console.warn("Notice: Master admin seeding skipped or already established:", e.message);
}

/**
 * Execute a callback within an ACID transaction
 * Automatically rolls back on any thrown error
 */
export function transaction(callback) {
  db.exec("BEGIN IMMEDIATE;");
  try {
    const result = callback(db);
    db.exec("COMMIT;");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK;");
    } catch {
      // Ignore rollback failure if transaction was not started
    }
    throw error;
  }
}

export default db;
