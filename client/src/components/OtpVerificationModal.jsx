import React, { useState, useEffect } from "react";
import { ShieldCheck, AlertCircle, RefreshCw, X, Mail, ArrowRight } from "lucide-react";
import { api } from "../services/api";

export default function OtpVerificationModal({
  isOpen,
  onClose,
  transferData,
  onSuccess,
  onOpenPhone,
  prefilledOtp,
}) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);

  // Sync prefilled OTP if passed from Inbox
  useEffect(() => {
    if (prefilledOtp) {
      setOtp(prefilledOtp);
      setError("");
    }
  }, [prefilledOtp]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(180);
      setOtp("");
      setError("");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, transferData]);

  if (!isOpen || !transferData) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit passcode");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await api.transfers.externalVerify({
        reference_id: transferData.reference_id,
        otp_code: otp.trim(),
      });
      onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to verify OTP code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setError("");
      await api.transfers.externalResend(transferData.reference_id);
      setTimeLeft(180);
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Brand Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#001F5F] via-[#004DA7] to-[#E2231A]" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#001F5F]/10 border border-[#001F5F]/20 flex items-center justify-center text-[#001F5F]">
              <ShieldCheck className="w-5 h-5 text-[#004DA7]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#001F5F]">Security Verification</h3>
              <p className="text-xs text-slate-500">Two-Factor Wire Authorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transfer Summary Pill */}
        <div className="my-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Beneficiary</span>
            <span className="font-bold text-slate-900">{transferData.beneficiary_name}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Destination Bank</span>
            <span className="text-slate-700 font-medium">{transferData.bank_name}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Transfer Amount</span>
            <span className="font-bold text-slate-900 font-mono">
              ${Number(transferData.amount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-700">Total with Wire Fee ($2.50)</span>
            <span className="font-bold text-[#004DA7] font-mono text-sm">
              ${(Number(transferData.amount) + 2.5).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Notice & Email helper */}
        <div className="mb-4 text-center">
          <p className="text-xs text-slate-600 leading-relaxed">
            A 6-digit authorization passcode was sent to{" "}
            <span className="font-mono text-[#001F5F] font-bold">
              {transferData.masked_email || transferData.email || "your registered email"}
            </span>
          </p>

          <button
            type="button"
            onClick={onOpenPhone}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#004DA7] hover:text-[#003882] font-semibold underline underline-offset-4"
          >
            <Mail className="w-3.5 h-3.5" />
            Open Email Inbox
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-center text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Enter 6-Digit Passcode
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setOtp(val);
                setError("");
              }}
              placeholder="000000"
              autoFocus
              className="w-full tracking-[0.5em] text-center text-2xl font-mono font-bold py-3.5 px-4 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white focus:ring-2 focus:ring-[#004DA7]/20 outline-none transition"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Timer & Resend */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Expires in:{" "}
              <span className={`font-mono font-bold ${timeLeft < 30 ? "text-[#E2231A]" : "text-slate-800"}`}>
                {formatTime(timeLeft)}
              </span>
            </span>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || timeLeft > 120}
              className={`flex items-center gap-1 font-semibold ${
                timeLeft > 120
                  ? "text-slate-400 cursor-not-allowed"
                  : "text-[#004DA7] hover:text-[#003882]"
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
              Resend Passcode
            </button>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading || otp.length !== 6 || timeLeft === 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#004DA7] hover:bg-[#003882] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-md shadow-[#004DA7]/25 transition"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Wire Transfer...
              </>
            ) : (
              <>
                Confirm &amp; Send Wire <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
