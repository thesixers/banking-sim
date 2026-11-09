/**
 * Resend email service wrapper for First Horizon Bank
 * All outbound emails are routed through this module.
 * Set RESEND_API_KEY and RESEND_FROM in your .env file.
 */
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM || "First Horizon Bank <onboarding@resend.dev>";

if (!apiKey || apiKey === "re_your_api_key_here") {
  console.warn(
    "\n⚠️  [Resend] RESEND_API_KEY is not set or is a placeholder.\n" +
    "   Real emails will NOT be sent. Set it in server/.env to enable delivery.\n"
  );
}

const resend = new Resend(apiKey || "re_placeholder");

/**
 * Send an email via Resend.
 * @param {{ to: string, subject: string, html: string, text?: string }} opts
 * @returns {Promise<{ id: string } | null>}  Resend message ID, or null on failure.
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    });

    if (error) {
      console.error("[Resend] Send error:", error);
      return null;
    }

    console.log(`[Resend] Email sent → ${to} | id: ${data?.id}`);
    return data;
  } catch (err) {
    console.error("[Resend] Unexpected error:", err.message);
    return null;
  }
}

