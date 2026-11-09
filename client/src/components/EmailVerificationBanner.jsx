import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Mail,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const DORMANCY_DAYS = 14;

/**
 * Returns the number of days remaining before the account goes dormant.
 * Returns null if the created_at date is unavailable.
 */
function getDaysRemaining(createdAt) {
  if (!createdAt) return null;
  const created = new Date(createdAt.includes("T") ? createdAt : createdAt + "Z");
  const msElapsed = Date.now() - created.getTime();
  const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(DORMANCY_DAYS - daysElapsed));
}

export default function EmailVerificationBanner({ onOpenInbox }) {
  const { user, verifyEmail, resendVerification } = useAuth();

  const [expanded, setExpanded] = useState(true);
  const [otpInput, setOtpInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [dismissed, setDismissed] = useState(false);

  // Don't render for admins, or verified accounts
  if (!user || user.email_verified || user.role === "ADMIN") return null;

  const isDormant = user.is_dormant === 1;
  const daysLeft = getDaysRemaining(user.created_at);
  const isUrgent = isDormant || (daysLeft !== null && daysLeft <= 3);
  const isCritical = isDormant || (daysLeft !== null && daysLeft <= 1);

  // Dormant or critical accounts cannot be dismissed
  if (dismissed && !isDormant && daysLeft !== null && daysLeft > 3) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otpInput.length < 6) return;
    setError("");
    setLoading(true);
    try {
      await verifyEmail(otpInput.trim());
      setSuccessMsg("Email verified! Your First Horizon account is fully active.");
    } catch (err) {
      setError(err.message || "Verification failed. Please check your passcode.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccessMsg("");
    setResending(true);
    try {
      const res = await resendVerification();
      setSuccessMsg(res?.message || "A new verification code has been dispatched to your email.");
      setOtpInput("");
    } catch (err) {
      setError(err.message || "Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // Border & Accent Color configuration
  const cardBorderClass = isDormant
    ? "border-l-4 border-l-[#E2231A] border-red-200 bg-red-50/40"
    : isCritical
    ? "border-l-4 border-l-orange-500 border-orange-200 bg-orange-50/40"
    : isUrgent
    ? "border-l-4 border-l-amber-500 border-amber-200 bg-amber-50/40"
    : "border-l-4 border-l-[#004DA7] border-slate-200 bg-white";

  const badgeBg = isDormant
    ? "bg-red-100 text-[#E2231A] border-red-300 font-bold animate-pulse"
    : isCritical
    ? "bg-orange-100 text-orange-800 border-orange-300 font-bold"
    : isUrgent
    ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
    : "bg-blue-50 text-[#004DA7] border-blue-200 font-semibold";

  return (
    <div className={`border rounded-2xl overflow-hidden shadow-sm transition-all ${cardBorderClass}`}>
      {/* Banner Header Row */}
      <div
        className="flex items-center gap-3 px-4 sm:px-6 py-3.5 cursor-pointer select-none bg-white/70 backdrop-blur-sm"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className={`flex-shrink-0 p-2 rounded-xl ${isCritical || isDormant ? "bg-red-100 text-[#E2231A]" : "bg-blue-50 text-[#004DA7]"}`}>
          <ShieldAlert className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-sm font-extrabold text-[#001F5F]">
              {isDormant
                ? "ACCOUNT DORMANT: Email Verification Expired"
                : isCritical
                ? "Urgent: Complete Email Verification"
                : isUrgent
                ? "Action Required: Verify Email Address"
                : "Security Notice: Please Verify Your Email Address"}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
              {isDormant
                ? "Dormant (Over 14 Days)"
                : daysLeft === 0
                ? "Expires Today"
                : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} grace remaining`}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 truncate">
            {isDormant
              ? "Transfers and withdrawals are locked until you enter the 6-digit verification passcode."
              : `Account automatically becomes dormant after 14 days if unverified — check ${user.email}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isCritical && !isDormant && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDismissed(true);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 transition rounded-lg"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </div>

      {/* Expanded Body */}
      {expanded && (
        <div className="px-4 sm:px-6 pb-5 pt-3 border-t border-slate-200/80 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            {/* Left Column: Context & Guidelines */}
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <Mail className="w-4 h-4 mt-0.5 text-[#004DA7] flex-shrink-0" />
                <span>
                  A <strong>6-digit verification code</strong> was sent to{" "}
                  <span className="text-[#001F5F] font-bold">{user.email}</span>.
                  Enter the code here to ensure uninterrupted access.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDormant ? "text-[#E2231A]" : "text-amber-600"}`} />
                <span>
                  {isDormant ? (
                    <strong className="text-[#E2231A]">
                      Your 14-day limit has lapsed. Wire transfers and outbound payments are currently blocked until you verify your email address.
                    </strong>
                  ) : (
                    <>
                      Under First Horizon security protocol, unverified accounts are automatically marked <strong className="text-slate-800">dormant</strong> after{" "}
                      <strong>{DORMANCY_DAYS} days</strong>.
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-4 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="inline-flex items-center gap-1.5 text-xs text-[#004DA7] hover:text-[#003882] transition font-bold disabled:opacity-50"
                >
                  {resending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" />
                  )}
                  {resending ? "Sending Code..." : "Resend Verification Email"}
                </button>

                {onOpenInbox && (
                  <button
                    type="button"
                    onClick={onOpenInbox}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 transition font-semibold underline underline-offset-2"
                  >
                    Open Email Inbox
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: 6-digit OTP Input */}
            <form onSubmit={handleVerify} className="space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                {isDormant ? "Enter Reactivation Code" : "Enter 6-Digit Passcode"}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center text-xl font-mono font-bold tracking-[0.4em] py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white focus:ring-2 focus:ring-[#004DA7]/15 outline-none transition"
              />

              {error && (
                <p className="text-xs text-red-700 flex items-center gap-1.5 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-[#E2231A]" /> {error}
                </p>
              )}
              {successMsg && (
                <p className="text-xs text-emerald-800 flex items-center gap-1.5 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" /> {successMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || otpInput.length < 6}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-xs font-bold shadow-md transition ${
                  isDormant
                    ? "bg-[#E2231A] hover:bg-[#c81e16] disabled:bg-slate-300"
                    : "bg-[#004DA7] hover:bg-[#003882] disabled:bg-slate-300"
                }`}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {isDormant ? "Verify & Reactivate Account" : "Verify Email Address"}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
