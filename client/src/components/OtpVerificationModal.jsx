import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, AlertCircle, RefreshCw, X, Mail, ArrowRight } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-navy-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Security Verification</h3>
              <p className="text-xs text-slate-400">Two-Factor Wire Authorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transfer Summary Pill */}
        <div className="my-4 p-3.5 rounded-2xl bg-navy-950/70 border border-slate-800/80 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>External Beneficiary</span>
            <span className="font-semibold text-white">{transferData.beneficiary_name}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Destination Bank</span>
            <span className="text-slate-300">{transferData.bank_name}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Transfer Amount</span>
            <span className="font-bold text-white font-mono">
              ${Number(transferData.amount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
            <span>Total with Wire Fee ($2.50)</span>
            <span className="font-bold text-brand-400 font-mono">
              ${(Number(transferData.amount) + 2.50).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Notice & Email simulator helper */}
        <div className="mb-4 text-center">
          <p className="text-xs text-slate-300">
            A 6-digit authorization code was sent via email to{" "}
            <span className="font-mono text-brand-400 font-semibold">
              {transferData.masked_email || transferData.email || "your registered email"}
            </span>
          </p>

          <button
            type="button"
            onClick={onOpenPhone}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium underline underline-offset-4"
          >
            <Mail className="w-3.5 h-3.5" />
            Open Simulated Email Inbox
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Enter 6-Digit Passcode
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setOtp(val);
                setError("");
              }}
              placeholder="000000"
              autoFocus
              className="w-full tracking-[0.5em] text-center text-2xl font-mono font-bold py-3.5 px-4 rounded-2xl bg-navy-950 border border-slate-700 text-white placeholder-slate-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Timer & Resend */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Expires in:{" "}
              <span className={`font-mono font-bold ${timeLeft < 30 ? "text-rose-400" : "text-slate-200"}`}>
                {formatTime(timeLeft)}
              </span>
            </span>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || timeLeft > 120}
              className={`flex items-center gap-1 font-medium ${
                timeLeft > 120
                  ? "text-slate-600 cursor-not-allowed"
                  : "text-brand-400 hover:text-brand-300"
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
              Resend OTP
            </button>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading || otp.length !== 6 || timeLeft === 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold shadow-lg shadow-brand-600/25 transition"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Transfer...
              </>
            ) : (
              <>
                Confirm & Send Wire <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
