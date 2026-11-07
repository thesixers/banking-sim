import { db, transaction } from "./index.js";
import { generateAccountNumber, DEFAULT_ROUTING_NUMBER, generateCardDetails, generateReferenceId } from "../utils/helpers.js";
import crypto from "crypto";

console.log("Testing Banking Simulator Database & ACID Engine...\n");

try {
  // 1. Verify Tables Exist
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    .all();
  console.log("✓ Active SQLite Tables:", tables.map((t) => t.name).join(", "));

  // 2. Insert Test Users
  const testUserId1 = crypto.randomUUID();
  const testUserId2 = crypto.randomUUID();

  db.prepare(`
    INSERT INTO users (id, full_name, email, phone_number, password_hash)
    VALUES (?, ?, ?, ?, ?)
  `).run(testUserId1, "Alice Walker", "alice@example.com", "+15551234567", "hash_alice");

  db.prepare(`
    INSERT INTO users (id, full_name, email, phone_number, password_hash)
    VALUES (?, ?, ?, ?, ?)
  `).run(testUserId2, "Bob Vance", "bob@example.com", "+15559876543", "hash_bob");

  console.log("✓ Test users inserted successfully");

  // 3. Create Accounts
  const card1 = generateCardDetails();
  const card2 = generateCardDetails();
  const accNum1 = generateAccountNumber();
  const accNum2 = generateAccountNumber();
  const accId1 = crypto.randomUUID();
  const accId2 = crypto.randomUUID();

  db.prepare(`
    INSERT INTO accounts (id, user_id, account_number, routing_number, balance, card_number, card_cvv, card_expiry)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(accId1, testUserId1, accNum1, DEFAULT_ROUTING_NUMBER, 1000.00, card1.cardNumber, card1.cvv, card1.expiry);

  db.prepare(`
    INSERT INTO accounts (id, user_id, account_number, routing_number, balance, card_number, card_cvv, card_expiry)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(accId2, testUserId2, accNum2, DEFAULT_ROUTING_NUMBER, 500.00, card2.cardNumber, card2.cvv, card2.expiry);

  console.log(`✓ Accounts created: Alice ($1,000.00), Bob ($500.00)`);

  // 4. Test Atomic Internal Transfer: Alice sends $250 to Bob
  const transferAmount = 250.00;
  const refId = generateReferenceId("TXN");

  transaction(() => {
    // Check Alice balance
    const sender = db.prepare("SELECT balance FROM accounts WHERE id = ?").get(accId1);
    if (sender.balance < transferAmount) {
      throw new Error("Insufficient funds");
    }

    // Debit Alice
    db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(transferAmount, accId1);

    // Credit Bob
    db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(transferAmount, accId2);

    // Record Transaction
    db.prepare(`
      INSERT INTO transactions (id, reference_id, sender_account_id, recipient_account_id, type, amount, status, description)
      VALUES (?, ?, ?, ?, 'INTERNAL', ?, 'COMPLETED', ?)
    `).run(crypto.randomUUID(), refId, accId1, accId2, transferAmount, "Transfer to Bob Vance");
  });

  const aliceBal = db.prepare("SELECT balance FROM accounts WHERE id = ?").get(accId1).balance;
  const bobBal = db.prepare("SELECT balance FROM accounts WHERE id = ?").get(accId2).balance;
  console.log(`✓ Atomic Transfer Completed! New Balances -> Alice: $${aliceBal}, Bob: $${bobBal}`);

  // 5. Test Transaction Rollback (Attempt overdrawing Bob by $10,000)
  let rollbackSuccess = false;
  try {
    transaction(() => {
      db.prepare("UPDATE accounts SET balance = balance - 10000 WHERE id = ?").run(accId2);
      throw new Error("Simulated failure after debit");
    });
  } catch {
    const bobAfterRollback = db.prepare("SELECT balance FROM accounts WHERE id = ?").get(accId2).balance;
    if (bobAfterRollback === bobBal) {
      rollbackSuccess = true;
      console.log(`✓ ACID Rollback Verified! Bob balance remained intact at $${bobAfterRollback}`);
    }
  }

  if (!rollbackSuccess) {
    throw new Error("Rollback failed!");
  }

  // 6. Cleanup test records
  db.prepare("DELETE FROM users WHERE id IN (?, ?)").run(testUserId1, testUserId2);
  console.log("✓ Cleaned up test data.\n");
  console.log("🎉 Phase 1 Database Foundations VERIFIED & PASSED!");
} catch (error) {
  console.error("Test failed:", error);
  process.exit(1);
}
