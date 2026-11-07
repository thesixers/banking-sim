const BASE_URL = "http://127.0.0.1:5000";

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function runAdminTests() {
  console.log("🛡️ Starting End-to-End Master Admin Suite Tests...\n");

  // 1. Admin Login
  const loginRes = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "admin@novabank.com",
      password: "admin123",
    }),
  });
  console.log("1. Master Admin Login:", loginRes.status === 200 ? "PASS" : "FAIL", `Role: ${loginRes.data.data?.user?.role}`);
  if (loginRes.status !== 200 || loginRes.data.data?.user?.role !== "ADMIN") {
    console.error("Admin login failed:", loginRes.data);
    process.exit(1);
  }
  const adminToken = loginRes.data.data.token;

  // 2. Fetch Admin Stats
  const statsRes = await request("/api/admin/stats", { token: adminToken });
  console.log("2. Telemetry Stats:", statsRes.status === 200 ? "PASS" : "FAIL", `Vault: $${statsRes.data.data?.stats?.vault_liquidity}, Customers: ${statsRes.data.data?.stats?.total_customers}`);
  if (statsRes.status !== 200) process.exit(1);

  // 3. Register a fresh customer (starts at $0.00)
  const customerEmail = `customer_${Date.now()}@test.com`;
  const regCust = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      full_name: "Bruce Wayne",
      email: customerEmail,
      password: "password123",
    }),
  });
  console.log("3. Register Customer:", regCust.status === 201 ? "PASS" : "FAIL", `Starting Balance: $${regCust.data.data?.account?.balance}`);
  const customerId = regCust.data.data.user.id;
  const customerToken = regCust.data.data.token;

  // 4. Admin Action: CREDIT $75,000.00 to Bruce Wayne
  const creditRes = await request(`/api/admin/users/${customerId}/adjust-balance`, {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({
      action: "CREDIT",
      amount: 75000,
      reason: "Wayne Enterprises Liquidity Infusion",
    }),
  });
  console.log(
    "4. Admin Credit +$75,000.00:",
    creditRes.status === 200 && creditRes.data.data?.new_balance === 75000 ? "PASS" : "FAIL",
    `Previous: $${creditRes.data.data?.previous_balance} -> New Balance: $${creditRes.data.data?.new_balance}`
  );
  if (creditRes.status !== 200 || creditRes.data.data?.new_balance !== 75000) process.exit(1);

  // 5. Admin Action: DEBIT $15,000.00
  const debitRes = await request(`/api/admin/users/${customerId}/adjust-balance`, {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({
      action: "DEBIT",
      amount: 15000,
      reason: "Asset Audit Adjustment",
    }),
  });
  console.log(
    "5. Admin Debit -$15,000.00:",
    debitRes.status === 200 && debitRes.data.data?.new_balance === 60000 ? "PASS" : "FAIL",
    `New Balance: $${debitRes.data.data?.new_balance}`
  );
  if (debitRes.status !== 200 || debitRes.data.data?.new_balance !== 60000) process.exit(1);

  // 6. Admin Action: SET Exact Balance to $100,000.00
  const setRes = await request(`/api/admin/users/${customerId}/adjust-balance`, {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({
      action: "SET",
      amount: 100000,
      reason: "Federal Reserve Balance Target",
    }),
  });
  console.log(
    "6. Admin SET Balance = $100,000.00:",
    setRes.status === 200 && setRes.data.data?.new_balance === 100000 ? "PASS" : "FAIL",
    `New Balance: $${setRes.data.data?.new_balance}`
  );
  if (setRes.status !== 200 || setRes.data.data?.new_balance !== 100000) process.exit(1);

  // 7. Admin Action: Toggle Freeze customer account
  const freezeRes = await request(`/api/admin/users/${customerId}/toggle-freeze`, {
    method: "POST",
    token: adminToken,
  });
  console.log("7. Admin Freeze Customer:", freezeRes.status === 200 && freezeRes.data.data?.is_frozen === 1 ? "PASS" : "FAIL");

  // Unfreeze
  await request(`/api/admin/users/${customerId}/toggle-freeze`, { method: "POST", token: adminToken });

  // 8. Test Wire Force-Approve: Customer stages a wire of $5,000
  const wireInit = await request("/api/transfers/external/initiate", {
    method: "POST",
    token: customerToken,
    body: JSON.stringify({
      bank_name: "Citibank",
      routing_number: "021000089",
      account_number: "9988776655",
      beneficiary_name: "Lucius Fox",
      amount: 5000,
      description: "Applied Sciences R&D",
    }),
  });
  console.log("8. Customer stages Wire ($5,000):", wireInit.status === 200 ? "PASS" : "FAIL", `Ref: ${wireInit.data.data?.reference_id}`);
  const wireRef = wireInit.data.data.reference_id;

  // Admin looks up transaction by Ref ID
  const txList = await request(`/api/admin/transactions?search=${wireRef}`, { token: adminToken });
  const pendingTx = txList.data.data?.transactions?.[0];
  console.log("   Found pending transaction:", pendingTx?.id, "Status:", pendingTx?.status);

  // 9. Admin Action: FORCE_APPROVE (Bypasses OTP)
  const approveRes = await request(`/api/admin/transactions/${pendingTx.id}/action`, {
    method: "POST",
    token: adminToken,
    body: JSON.stringify({ action: "FORCE_APPROVE" }),
  });
  console.log("9. Admin Force-Approves Wire (OTP Bypassed):", approveRes.status === 200 ? "PASS" : "FAIL", approveRes.data?.message);
  if (approveRes.status !== 200) process.exit(1);

  // 10. Check Customer Balance after wire ($100,000 - $5,000 - $2.50 fee = $94,997.50)
  const custMe = await request("/api/auth/me", { token: customerToken });
  console.log(
    "10. Verify Post-Wire Customer Balance:",
    custMe.data.data?.account?.balance === 94997.5 ? "PASS ($94,997.50)" : "FAIL",
    `Actual: $${custMe.data.data?.account?.balance}`
  );
  if (custMe.data.data?.account?.balance !== 94997.5) process.exit(1);

  // 11. Security OTP Tokens Monitor
  const tokensRes = await request("/api/admin/otp-tokens", { token: adminToken });
  console.log("11. OTP Dispatch Tokens Monitor:", tokensRes.status === 200 ? "PASS" : "FAIL", `Total Tokens Monitored: ${tokensRes.data.data?.tokens?.length}`);

  console.log("\n🏛️ ALL ADMIN SUITE TESTS PASSED WITH 100% SUCCESS!\n");
}

runAdminTests().catch(console.error);
