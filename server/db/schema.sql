-- Banking Simulator SQLite Schema
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    phone_number TEXT, -- Optional phone number
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'ADMIN')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_number TEXT UNIQUE NOT NULL,
    routing_number TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'CHECKING',
    balance REAL NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    card_number TEXT NOT NULL,
    card_cvv TEXT NOT NULL,
    card_expiry TEXT NOT NULL,
    is_frozen INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON accounts(account_number);

-- 3. Transactions Table (Double-entry Ledger capable)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    reference_id TEXT UNIQUE NOT NULL,
    sender_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    recipient_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('INTERNAL', 'EXTERNAL', 'FAUCET', 'ADMIN_ADJUSTMENT')),
    amount REAL NOT NULL CHECK (amount > 0),
    fee REAL NOT NULL DEFAULT 0.00 CHECK (fee >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'PENDING_OTP', 'FAILED', 'REVERSED')),
    external_bank_details TEXT, -- JSON blob for external bank name, routing, account, beneficiary
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recipient ON transactions(recipient_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ref ON transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

-- 4. OTP Tokens Table (Email-first authentication)
CREATE TABLE IF NOT EXISTS otp_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    phone_number TEXT,
    code_hash TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'EXTERNAL_TRANSFER',
    reference_id TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    verified INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_otp_reference ON otp_tokens(reference_id);
CREATE INDEX IF NOT EXISTS idx_otp_user ON otp_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_tokens(email);

-- 5. Notifications (Simulated Secure Email & Alert Log)
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT,
    phone_number TEXT,
    title TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    html_content TEXT,
    type TEXT NOT NULL DEFAULT 'EMAIL',
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_email ON notifications(email);
