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

// Migration: Pending registrations table for email verification
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_registrations (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
} catch (e) {
  console.warn("Migration warning for pending_registrations:", e.message);
}

// Migration: Email verification + dormancy fields on users
try {
  const userCols = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
  if (!userCols.includes("email_verified")) {
    db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;");
  }
  if (!userCols.includes("email_verified_at")) {
    db.exec("ALTER TABLE users ADD COLUMN email_verified_at TEXT;");
  }
  if (!userCols.includes("is_dormant")) {
    db.exec("ALTER TABLE users ADD COLUMN is_dormant INTEGER NOT NULL DEFAULT 0;");
  }
  if (!userCols.includes("dormant_at")) {
    db.exec("ALTER TABLE users ADD COLUMN dormant_at TEXT;");
  }
} catch (e) {
  console.warn("Migration warning for email_verified/dormancy fields:", e.message);
}

// Mark existing users (admin etc.) as already email-verified so they aren't affected
try {
  db.exec(`UPDATE users SET email_verified = 1 WHERE email_verified = 0 AND role = 'ADMIN';`);
} catch (e) {}

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

// Migration: Card status & application fields on accounts
try {
  const accountCols = db.prepare("PRAGMA table_info(accounts)").all().map((c) => c.name);
  if (!accountCols.includes("card_status")) {
    db.exec("ALTER TABLE accounts ADD COLUMN card_status TEXT NOT NULL DEFAULT 'NONE';");
  }
  if (!accountCols.includes("card_applied_at")) {
    db.exec("ALTER TABLE accounts ADD COLUMN card_applied_at TEXT;");
  }
  // Sync existing accounts: if card_number is not empty, mark ACTIVE
  db.exec("UPDATE accounts SET card_status = 'ACTIVE' WHERE card_number != '' AND (card_status = 'NONE' OR card_status IS NULL);");
} catch (e) {
  console.warn("Migration warning for accounts card_status fields:", e.message);
}

// Migration: Ensure admin_role column exists on users (SUPER_ADMIN vs LIMITED_ADMIN)
try {
  const userCols = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
  if (!userCols.includes("admin_role")) {
    db.exec("ALTER TABLE users ADD COLUMN admin_role TEXT;");
  }
  // Ensure master admin has SUPER_ADMIN
  db.exec("UPDATE users SET role = 'ADMIN', admin_role = 'SUPER_ADMIN' WHERE email = 'admin@novabank.com';");
} catch (e) {
  console.warn("Migration warning for users.admin_role:", e.message);
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
      INSERT INTO users (id, full_name, email, phone_number, password_hash, role, admin_role)
      VALUES (?, 'Nova Bank Master Administrator', ?, NULL, ?, 'ADMIN', 'SUPER_ADMIN')
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
