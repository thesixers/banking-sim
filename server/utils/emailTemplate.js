/**
 * Email template generators for Nova Bank Simulation
 * Engineered to follow best practices: clean typography, anti-spam structure,
 * zero spam-trigger keywords, semantic HTML tables, and matching plain-text fallbacks.
 */

/**
 * Mask an email address for privacy display (e.g. j***e@domain.com)
 */
export function maskEmail(email) {
  if (!email || !email.includes("@")) return email || "";
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const maskedLocal = `${local[0]}${"*".repeat(Math.min(local.length - 2, 4))}${local.slice(-1)}`;
  return `${maskedLocal}@${domain}`;
}

/**
 * Clean, non-spammy, modern HTML email template for Wire Transfer OTP verification
 */
export function generateWireOtpEmailHtml({
  fullName,
  otpCode,
  amount,
  fee = 2.5,
  bankName,
  beneficiaryName,
  referenceId,
  expiresInMinutes = 3,
}) {
  const formattedAmount = Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedFee = Number(fee).toFixed(2);
  const totalDeduction = (Number(amount) + Number(fee)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Security Passcode — Nova Bank</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <!-- Preheader text (preview in inbox) -->
  <div style="display: none; font-size: 1px; color: #ffffff; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your one-time wire authorization code is ${otpCode}. Valid for ${expiresInMinutes} minutes.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 22px; background-color: #0f172a; border-bottom: 1px solid #1e293b;">
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-decoration: none;">
                      NOVA<span style="color: #6366f1;">BANK</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #cbd5e1; background-color: rgba(255, 255, 255, 0.12); padding: 4px 10px; border-radius: 9999px;">
                      Verification Code
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <h1 style="margin: 0 0 10px; font-size: 18px; font-weight: 700; color: #0f172a;">
                Wire Transfer Authorization
              </h1>
              <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.5;">
                Hello <strong>${fullName}</strong>, we received a request to authorize an external wire transfer from your Nova Bank account. Please enter the verification code below to authorize this transaction.
              </p>

              <!-- OTP Display Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 22px 0; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px;">
                <tr>
                  <td align="center" style="padding: 22px 16px;">
                    <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 6px;">
                      One-Time Passcode
                    </span>
                    <span style="display: inline-block; font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4338ca;">
                      ${otpCode}
                    </span>
                    <span style="display: block; font-size: 12px; color: #64748b; margin-top: 6px;">
                      Expires in ${expiresInMinutes} minutes • Do not share this code with anyone
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Transaction Summary Table -->
              <div style="margin: 24px 0 16px;">
                <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #334155; margin-bottom: 10px;">
                  Transfer Details
                </span>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px;">
                  <tr>
                    <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Beneficiary</td>
                    <td align="right" style="padding: 10px 14px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${beneficiaryName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Receiving Bank</td>
                    <td align="right" style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${bankName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Transfer Amount</td>
                    <td align="right" style="padding: 10px 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">$${formattedAmount} USD</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Wire Fee</td>
                    <td align="right" style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #f1f5f9;">$${formattedFee} USD</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 14px; color: #0f172a; font-weight: 700; background-color: #f8fafc; border-bottom-left-radius: 10px;">Total Debit</td>
                    <td align="right" style="padding: 10px 14px; font-weight: 800; color: #4338ca; background-color: #f8fafc; border-bottom-right-radius: 10px;">$${totalDeduction} USD</td>
                  </tr>
                </table>
              </div>

              <!-- Security Advisory -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 20px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px;">
                <tr>
                  <td style="padding: 10px 14px; font-size: 12px; color: #92400e; line-height: 1.5;">
                    <strong>Security Notice:</strong> If you did not initiate this wire request, please sign in to Nova Bank immediately to freeze your card and account.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 11px; color: #94a3b8;">
                Reference: <span style="font-family: monospace;">${referenceId}</span>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                Nova Bank Core Security • Automated transaction advisory • Replies to this email address are not monitored.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Clean plain-text fallback for wire OTP
 */
export function generateWireOtpPlainText({
  fullName,
  otpCode,
  amount,
  bankName,
  beneficiaryName,
  referenceId,
  expiresInMinutes = 3,
}) {
  return `Nova Bank Security Verification

Hello ${fullName},

Your one-time passcode for wire transfer authorization is:

${otpCode}

Transaction Details:
- Beneficiary: ${beneficiaryName}
- Destination Bank: ${bankName}
- Amount: $${Number(amount).toFixed(2)} USD
- Reference ID: ${referenceId}
- Validity: ${expiresInMinutes} minutes

If you did not authorize this transaction, please log in to freeze your account immediately.

Nova Bank Security Core
`;
}

/**
 * Clean HTML template for New Customer Account Opening
 */
export function generateWelcomeEmailHtml({
  fullName,
  accountNumber,
  routingNumber,
  initialBalance,
}) {
  const formattedBalance = Number(initialBalance).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Nova Bank</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <div style="display: none; font-size: 1px; color: #ffffff; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your Nova Bank checking account #${accountNumber} is active with an opening balance of $${formattedBalance}.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 22px; background-color: #0f172a; border-bottom: 1px solid #1e293b;">
              <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                NOVA<span style="color: #6366f1;">BANK</span>
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <h1 style="margin: 0 0 10px; font-size: 18px; font-weight: 700; color: #0f172a;">
                Welcome to Nova Bank, ${fullName}
              </h1>
              <p style="margin: 0 0 20px; font-size: 14px; color: #475569;">
                Your online checking account has been established and is ready for use. Below are your account details and starting balance.
              </p>

              <!-- Account Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; margin: 16px 0;">
                <tr>
                  <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Account Number</td>
                  <td align="right" style="padding: 10px 14px; font-family: monospace; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${accountNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Routing Number</td>
                  <td align="right" style="padding: 10px 14px; font-family: monospace; font-weight: 600; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${routingNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Account Type</td>
                  <td align="right" style="padding: 10px 14px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #e2e8f0;">Checking (USD)</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #0f172a; font-weight: 700; background-color: #f1f5f9; border-bottom-left-radius: 10px;">Opening Balance</td>
                  <td align="right" style="padding: 10px 14px; font-weight: 800; color: #16a34a; background-color: #f1f5f9; border-bottom-right-radius: 10px;">$${formattedBalance} USD</td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; font-size: 13px; color: #475569; line-height: 1.5;">
                For security, all external wire transfers require email two-factor authorization codes sent to this address.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Nova Bank Core • Member FDIC Simulation • automated notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Clean plain-text fallback for welcome email
 */
export function generateWelcomePlainText({ fullName, accountNumber, routingNumber, initialBalance }) {
  return `Welcome to Nova Bank

Hello ${fullName},

Your Nova Bank checking account is active:
- Account Number: ${accountNumber}
- Routing Number: ${routingNumber}
- Account Type: Checking
- Available Balance: $${Number(initialBalance).toFixed(2)} USD

Nova Bank Member FDIC Simulation
`;
}

/**
 * Clean HTML template for Transaction Completion Alert
 */
export function generateTransactionAlertHtml({
  fullName,
  type = "DEBIT", // "DEBIT" | "CREDIT"
  amount,
  counterparty,
  referenceId,
  newBalance,
}) {
  const isCredit = type === "CREDIT";
  const badgeColor = isCredit ? "#16a34a" : "#0f172a";
  const actionText = isCredit ? "Funds Received" : "Funds Transferred";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${actionText} — Nova Bank</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding: 32px 12px; background-color: #f8fafc;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
          <tr>
            <td style="padding: 24px 30px; background-color: #0f172a;">
              <span style="font-size: 18px; font-weight: 800; color: #ffffff;">NOVA<span style="color: #6366f1;">BANK</span></span>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 30px;">
              <h2 style="margin: 0 0 10px; font-size: 16px; font-weight: 700; color: ${badgeColor};">
                ${actionText}
              </h2>
              <p style="margin: 0 0 18px; font-size: 14px; color: #475569;">
                Hello ${fullName}, your account has a new transaction activity.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px;">
                <tr>
                  <td style="padding: 10px 14px; color: #64748b;">Amount</td>
                  <td align="right" style="padding: 10px 14px; font-weight: 700; color: ${badgeColor};">$${Number(amount).toFixed(2)} USD</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #64748b;">Details</td>
                  <td align="right" style="padding: 10px 14px; color: #0f172a;">${counterparty}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #64748b;">Reference</td>
                  <td align="right" style="padding: 10px 14px; font-family: monospace; color: #0f172a;">${referenceId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #0f172a; font-weight: 700;">Updated Balance</td>
                  <td align="right" style="padding: 10px 14px; font-weight: 800; color: #0f172a;">$${Number(newBalance).toFixed(2)} USD</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">Nova Bank Core • Automated Transaction Alert</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
