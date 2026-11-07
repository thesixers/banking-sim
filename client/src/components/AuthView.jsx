import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ArrowRight, RefreshCw, AlertCircle, Sparkles, Building, Mail } from "lucide-react";

export default function AuthView() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // Quick helper to fill test credentials
  const fillDemo = () => {
    setIsLogin(false);
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFullName(`Alex Morgan`);
    setEmail(`alex_${rand}@novabank.com`);
    setPassword("password123");
  };

  const fillAdmin = () => {
    setIsLogin(true);
    setEmail("admin@novabank.com");
    setPassword("admin123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy-950 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-navy-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 mb-3 shadow-lg shadow-brand-500/10">
            <Building className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Nova Bank</h1>
          <p className="text-xs text-slate-400 mt-1">Full-Stack Core Banking & Wire Simulator</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 mb-6 bg-navy-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
            className={`py-2.5 rounded-xl text-xs font-semibold transition ${
              isLogin ? "bg-brand-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
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
            className={`py-2.5 rounded-xl text-xs font-semibold transition ${
              !isLogin ? "bg-brand-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Open Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Legal Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full text-sm py-2.5 px-3.5 rounded-xl bg-navy-950 border border-slate-700 text-white placeholder-slate-600 focus:border-brand-500 outline-none transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full text-sm py-2.5 px-3.5 rounded-xl bg-navy-950 border border-slate-700 text-white placeholder-slate-600 focus:border-brand-500 outline-none transition"
            />
            {!isLogin && (
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-brand-400 inline" /> Security OTPs & notices will be sent to this email.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-sm py-2.5 px-3.5 rounded-xl bg-navy-950 border border-slate-700 text-white placeholder-slate-600 focus:border-brand-500 outline-none transition"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 text-white font-semibold shadow-lg shadow-brand-600/25 transition mt-2"
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
        </form>

        {/* Demo Account Auto-Fill */}
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-2 text-center">
          <div>
            <button
              type="button"
              onClick={fillDemo}
              className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Demo: Auto-Fill New Customer
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={fillAdmin}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Quick Master Administrator Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
