# 🏦 Nova Bank — Full-Stack Core Banking & Wire Simulator

A modern, high-performance online banking simulator powered by **[Vibe-GX](https://github.com/thesixers/vibe)** on the backend, **React + Tailwind CSS** on the frontend, and Node.js 24's native **`node:sqlite`** with ACID transactions.

---

## 🚀 Key Features

* **Email-First Customer Registration & KYC**:
  * Clean sign-up requiring only legal full name, email, and password.
  * No phone number required.
  * Every new customer account starts with a verified **$0.00** opening balance.
  * Automated welcome email delivered to the user's simulated inbox.
  * Auto-provisions a 10-digit Checking Account Number and 9-digit Routing Number.
  * Issues a virtual **Platinum Visa Debit Card** (Card Number, CVV, Expiry, toggle freeze/reveal).

* **Simulated Email Inbox & Security Feed**:
  * Built-in simulated email drawer accessible from the top navbar.
  * Renders anti-spam HTML email templates (Wire OTP authorizations, account alerts, receipts).
  * Includes one-click **Autofill OTP** to instantly copy verification codes into the transfer modal.

* **Internal Transfers (Within Bank)**:
  * Instant atomic transfer between customers via Account Number or Email.
  * Real-time recipient lookup with verified beneficiary name preview.
  * Instant debit & credit email notifications logged to both parties.

* **External Wire Transfers (Outside Bank)**:
  * Direct wires to major banks (JPMorgan Chase, Bank of America, Wells Fargo, Citibank, Capital One).
  * Enforces **Two-Factor Email OTP Verification**.
  * 3-minute cryptographic token expiration with sliding-window rate limiting.
  * Flat $2.50 simulated wire fee.

* **🏛️ Master Administrator Central Control Panel**:
  * **Global Telemetry**: Real-time vault liquidity reserves, customer count, transaction volume, pending wires, and frozen accounts.
  * **Customer & Vault Control**:
    * Search customers by name, email, or account number.
    * **Add or Adjust Balance**: Credit any amount (e.g. +$50,000.00), debit funds, or set exact target balance with ledger memos.
    * **Instant Freeze/Unfreeze**: One-click lock/unlock of any customer's account and debit card.
    * **Password Reset**: Administrator override for customer credentials.
    * **Delete Customer**: Remove accounts with cascading database cleanup.
  * **Master Ledger Control**:
    * Global transaction search and status/type filters.
    * **Force Approve Wire**: Administrator override to immediately authorize and dispatch pending wires without requiring customer OTP.
    * **Cancel Wire**: Abort pending wire transfers.
    * **Reverse Transaction**: Rollback completed transfers and restore balances atomically.
  * **Live OTP Dispatch Monitor**:
    * Real-time inspection of active and historical OTP tokens across all customers with manual force-verify capability.

---

## 🔑 Default Administrator Credentials

| Role | Email | Password | Initial Vault Treasury |
| :--- | :--- | :--- | :--- |
| **Master Admin** | `admin@novabank.com` | `admin123` | $1,000,000.00 USD |

*(On the login screen, click **"Quick Master Administrator Sign In"** for one-click demo access).*

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Backend Framework** | **[Vibe-GX](https://github.com/thesixers/vibe)** | High-performance ESM router, plugins (`app.register`), route interceptors, CORS, and rate limiting. |
| **Database** | **SQLite (`node:sqlite`)** | Built into Node.js 24. ACID transactions with WAL mode and foreign key constraints. |
| **Authentication** | **JWT + Bcrypt.js** | Stateless tokens with role-based authorization (`CUSTOMER` vs `ADMIN`). |
| **Frontend** | **React 18 + Vite 5 + Tailwind CSS** | Ultra-responsive fintech portal with dark mode aesthetics and Lucide icons. |

---

## ⚡ Quick Start

From the `~/banking-sim` directory:

### 1. Launch the Unified Server (Backend API + Frontend)
```bash
cd ~/banking-sim
npm start
```

Open your browser at:
👉 **`http://localhost:5000`**

---

### 2. Run Automated Test Suites

**Customer Test Suite ($0 starting balance, Email OTP flow):**
```bash
node server/test-api.js
```

**Admin Control Suite (Balance adjustments, wire force-approvals, freezing):**
```bash
node server/test-admin.js
```
