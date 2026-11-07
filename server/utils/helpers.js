import crypto from "crypto";
export * from "./emailTemplate.js";

/**
 * Generate a unique 10-digit account number starting with 10
 */
export function generateAccountNumber() {
  const randomSuffix = crypto.randomInt(10000000, 99999999).toString();
  return `10${randomSuffix}`;
}

/**
 * Bank Simulator fixed routing number (9 digits)
 */
export const DEFAULT_ROUTING_NUMBER = "021000021";

/**
 * Generate a realistic 16-digit virtual Visa debit card
 */
export function generateCardDetails() {
  const part1 = "4532";
  const part2 = crypto.randomInt(1000, 9999).toString();
  const part3 = crypto.randomInt(1000, 9999).toString();
  const part4 = crypto.randomInt(1000, 9999).toString();
  const cardNumber = `${part1} ${part2} ${part3} ${part4}`;

  const cvv = crypto.randomInt(100, 999).toString();

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String((now.getFullYear() + 3) % 100).padStart(2, "0");
  const expiry = `${month}/${year}`;

  return {
    cardNumber,
    cvv,
    expiry,
  };
}

/**
 * Generate unique transaction reference ID
 */
export function generateReferenceId(prefix = "TXN") {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomStr = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${timestamp}-${randomStr}`;
}

/**
 * Generate 6-digit secure numeric OTP
 */
export function generateOtpCode() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash an OTP code for storage
 */
export function hashOtp(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}
