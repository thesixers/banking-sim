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

async function runTests() {
  console.log("🚀 Starting End-to-End API Test ($0 Starting Balance, Email-First)...\n");

  // 1. Health Check
  const health = await request("/api/health");
  console.log("1. Health Check:", health.status === 200 ? "PASS" : "FAIL", health.data);
  if (health.status !== 200) process.exit(1);

  // 2. Register Customer A (No phone number, No initial deposit!)
  const userAEmail = `sarah_${Date.now()}@test.com`;
  const regA = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      full_name: "Sarah Connor",
      email: userAEmail,
      password: "password123",
    }),
  });
  const accA = regA.data.data?.account;
  console.log(
    "2. Register User A:",
    regA.status === 201 && accA?.balance === 0 ? "PASS ($0.00 Starting Balance verified)" : "FAIL",
    `Account #${accA?.account_number}, Balance: $${accA?.balance}`
  );
  if (regA.status !== 201 || accA?.balance !== 0) {
    console.error("Register Error:", regA.data);
    process.exit(1);
  }
  const tokenA = regA.data.data.token;
  const accNumA = accA.account_number;

  // 3. Register Customer B (Starts at $0.00)
  const userBEmail = `john_${Date.now()}@test.com`;
  const regB = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      full_name: "John Doe",
      email: userBEmail,
      password: "password123",
    }),
  });
  const accB = regB.data.data?.account;
  console.log(
    "3. Register User B:",
    regB.status === 201 && accB?.balance === 0 ? "PASS ($0.00 Starting Balance verified)" : "FAIL",
    `Account #${accB?.account_number}, Balance: $${accB?.balance}`
  );
  if (regB.status !== 201 || accB?.balance !== 0) process.exit(1);
  const accNumB = accB.account_number;

  // 4. Verify Welcome Email in User A's Inbox
  const inboxA = await request("/api/otp/inbox", { token: tokenA });
  console.log("4. User A Inbox Count:", inboxA.data.data?.notifications?.length, "Latest Title:", inboxA.data.data?.notifications?.[0]?.title);
  const welcomeEmail = inboxA.data.data?.notifications?.[0];
  if (!welcomeEmail || welcomeEmail.type !== "EMAIL" || !welcomeEmail.html_content) {
    console.error("Welcome email missing or invalid");
    process.exit(1);
  }
  console.log("   Welcome Email Subject:", welcomeEmail.subject);

  // 5. Test Faucet: Fund User A with test direct deposit of $2,000
  const faucetRes = await request("/api/accounts/faucet", {
    method: "POST",
    token: tokenA,
    body: JSON.stringify({
      amount: 2000,
      label: "Simulated Direct Deposit Payroll",
    }),
  });
  console.log("5. Faucet Deposit $2,000 to User A:", faucetRes.status === 200 ? "PASS" : "FAIL", `New Balance: $${faucetRes.data.data?.new_balance}`);
  if (faucetRes.status !== 200) process.exit(1);

  // 6. Internal Transfer from User A -> User B ($350)
  const intTx = await request("/api/transfers/internal", {
    method: "POST",
    token: tokenA,
    body: JSON.stringify({
      recipient_account_number: accNumB,
      amount: 350,
      description: "Payment for consulting",
    }),
  });
  console.log("6. Internal Transfer $350:", intTx.status === 201 ? "PASS" : "FAIL", `Ref: ${intTx.data.data?.reference_id}`);
  if (intTx.status !== 201) process.exit(1);

  // 7. External Wire Transfer Initiate (Requires Email OTP)
  const extInit = await request("/api/transfers/external/initiate", {
    method: "POST",
    token: tokenA,
    body: JSON.stringify({
      bank_name: "JPMorgan Chase",
      routing_number: "021000021",
      account_number: "9876543210",
      beneficiary_name: "Miles Dyson",
      amount: 450,
      description: "Cyberdyne Systems Invoice",
    }),
  });
  console.log("7. External Wire Initiate:", extInit.status === 200 ? "PASS" : "FAIL", `Ref: ${extInit.data.data?.reference_id}`);
  console.log("   OTP sent to masked email:", extInit.data.data?.masked_email);
  if (extInit.status !== 200) process.exit(1);
  const refId = extInit.data.data.reference_id;
  const otpCode = extInit.data.data.simulated_otp_hint;

  // 8. Verify OTP Email received in Inbox
  const inboxUpdated = await request("/api/otp/inbox", { token: tokenA });
  const otpEmail = inboxUpdated.data.data?.notifications?.[0];
  console.log("8. OTP Email received in Inbox:", otpEmail?.title, "Subject:", otpEmail?.subject);
  if (!otpEmail?.html_content?.includes("One-Time Passcode")) {
    console.error("OTP email HTML does not include expected structure");
    process.exit(1);
  }

  // 9. Verify OTP and Complete Transfer
  const verifyRes = await request("/api/transfers/external/verify", {
    method: "POST",
    token: tokenA,
    body: JSON.stringify({
      reference_id: refId,
      otp_code: otpCode,
    }),
  });
  console.log("9. External Wire Verify & Finalize:", verifyRes.status === 200 ? "PASS" : "FAIL", `New Balance: $${verifyRes.data.data?.new_balance}`);
  if (verifyRes.status !== 200) process.exit(1);

  console.log("\n🎉 ALL TESTS PASSED! NEW USERS START AT $0.00 WITH ZERO BALANCES.\n");
}

runTests().catch(console.error);
