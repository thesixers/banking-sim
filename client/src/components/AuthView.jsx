import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { FirstHorizonLogo } from "./FirstHorizonLanding";
import {
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Mail,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function AuthView({ initialMode = "login", onBackToLanding }) {
  const { login, register, reactivateDormant } = useAuth();
  const [isLogin, setIsLogin] = useState(initialMode === "login");

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Dormant account reactivation state
  const [isDormantMode, setIsDormantMode] = useState(false);
  const [reactivateOtp, setReactivateOtp] = useState("");
  const [resendStatus, setResendStatus] = useState("");
  const [resendingCode, setResendingCode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResendStatus("");
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email: email.trim(), password });
      } else {
        await register({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
        });
      }
    } catch (err) {
      if (err.data?.code === "ACCOUNT_DORMANT" || err.message?.toLowerCase().includes("dormant")) {
        setIsDormantMode(true);
        setError("Your account is dormant because email verification was not completed within 14 days.");
      } else {
        setError(err.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async (e) => {
    e.preventDefault();
    if (reactivateOtp.length < 6) return;
    setError("");
    setResendStatus("");
    setLoading(true);

    try {
      await reactivateDormant({
        email: email.trim(),
        otp_code: reactivateOtp.trim(),
      });
      // Context logs in automatically and redirects
    } catch (err) {
      setError(err.message || "Failed to reactivate. Please check your verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendDormantCode = async () => {
    setError("");
    setResendingCode(true);
    try {
      await api.auth.resendDormantCode(email.trim());
      setResendStatus("A new verification code has been dispatched to your email address.");
      setReactivateOtp("");
    } catch (err) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setResendingCode(false);
    }
  };

  // ── DORMANT REACTIVATION SCREEN ──────────────────────────────────────────
  if (isDormantMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4F6F9] relative overflow-hidden">
        {/* Subtle Brand Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E2231A]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#004DA7]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md bg-white border border-red-200 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-[#E2231A] mb-3 shadow-md shadow-red-500/10">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#001F5F] tracking-tight">Account Dormant</h1>
            <p className="text-xs text-[#E2231A] font-bold mt-1 uppercase tracking-wider">
              14-Day Email Verification Expired
            </p>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your account for <span className="text-[#004DA7] font-semibold">{email}</span> was marked dormant
              because email verification was not completed within the 14-day statutory grace period.
            </p>
          </div>

          <form onSubmit={handleReactivate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 text-center">
                Enter 6-Digit Passcode
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={reactivateOtp}
                onChange={(e) => setReactivateOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center text-2xl font-mono font-bold tracking-[0.4em] py-3 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#E2231A] focus:bg-white focus:ring-2 focus:ring-[#E2231A]/20 outline-none transition"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {resendStatus && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{resendStatus}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || reactivateOtp.length < 6}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#E2231A] hover:bg-[#c81e16] disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold text-sm shadow-lg shadow-red-600/20 transition mt-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Verify &amp; Reactivate Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResendDormantCode}
                disabled={resendingCode}
                className="inline-flex items-center gap-1.5 text-xs text-[#004DA7] hover:text-[#003882] transition font-semibold disabled:opacity-50"
              >
                {resendingCode ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                Resend Code
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDormantMode(false);
                  setError("");
                }}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── STANDARD SIGN IN / OPEN ACCOUNT SCREEN ───────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4F6F9] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#004DA7]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#001F5F]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
        {/* Back to Homepage Button */}
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#001F5F] transition font-semibold mb-6 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" /> Back to First Horizon Homepage
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <FirstHorizonLogo variant="default" className="h-9" />
          </div>
          <p className="text-xs text-slate-500 font-medium">Digital Banking &amp; Core Wire Gateway</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 mb-6 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition ${
              isLogin
                ? "bg-[#001F5F] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition ${
              !isLogin
                ? "bg-[#001F5F] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Open Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Legal Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full text-sm py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white focus:ring-2 focus:ring-[#004DA7]/15 outline-none transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full text-sm py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white focus:ring-2 focus:ring-[#004DA7]/15 outline-none transition"
            />
            {!isLogin && (
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#004DA7] inline flex-shrink-0" />
                <span>Verification code sent on submission. 14-day limit applies before dormancy.</span>
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              {isLogin && (
                <span className="text-[11px] text-[#004DA7] font-semibold hover:underline cursor-pointer">
                  Forgot Password?
                </span>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-sm py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white focus:ring-2 focus:ring-[#004DA7]/15 outline-none transition"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#004DA7] hover:bg-[#003882] disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold text-sm shadow-md shadow-[#004DA7]/20 transition mt-2 active:scale-[0.99]"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isLogin ? (
              <>
                Sign In to Banking <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Create Account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {isLogin && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px] text-slate-400 font-medium">Quick Demo Admin:</span>
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@novabank.com");
                  setPassword("admin123");
                }}
                className="text-[11px] text-[#004DA7] hover:text-[#001F5F] font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg transition"
              >
                Auto-fill Admin (admin@novabank.com)
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
