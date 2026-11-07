import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

export default async function otpPlugin(api) {
  /**
   * Handler to retrieve all simulated incoming notifications & emails
   */
  const getInboxFeed = (req, res) => {
    const notifications = db.prepare(`
      SELECT id, email, title, subject, message, html_content, type, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY rowid DESC
      LIMIT 30
    `).all(req.user.id);

    return res.success({ notifications });
  };

  /**
   * Handler to mark notifications as read
   */
  const markRead = (req, res) => {
    const { id } = req.body || {};
    if (id) {
      db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?").run(id, req.user.id);
    } else {
      db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(req.user.id);
    }

    return res.success({ ok: true }, "Notifications marked as read");
  };

  // Primary routes for Email Inbox
  api.get("/inbox", { intercept: requireAuth }, getInboxFeed);
  api.post("/mark-read", { intercept: requireAuth }, markRead);

  // Backwards compatibility routes for existing client callers
  api.get("/sms-feed", { intercept: requireAuth }, getInboxFeed);
  api.post("/sms-mark-read", { intercept: requireAuth }, markRead);

  /**
   * GET /pending-otp/:reference_id
   * Helper endpoint to fetch the latest active notification for a transaction
   */
  api.get("/pending-otp/:reference_id", { intercept: requireAuth }, (req, res) => {
    const { reference_id } = req.params;

    const notif = db.prepare(`
      SELECT id, title, subject, message, html_content, created_at 
      FROM notifications 
      WHERE user_id = ? AND (message LIKE ? OR html_content LIKE ?)
      ORDER BY created_at DESC LIMIT 1
    `).get(req.user.id, `%${reference_id}%`, `%${reference_id}%`);

    return res.success({
      reference_id,
      notification: notif || null,
    });
  });
}
