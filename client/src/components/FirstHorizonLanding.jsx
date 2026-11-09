import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  Wallet,
  CreditCard,
  Mail,
  Zap,
  Clock,
  Shield,
  Check,
  RefreshCw,
  User,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Send,
  Sliders,
} from "lucide-react";

/**
 * First Horizon Official SVG Logo Component
 * Reproduces the iconic red & blue horizon shield with star & bold wordmark.
 */
export function FirstHorizonLogo({ className = "h-8", variant = "default" }) {
  const isLight = variant === "light";
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Horizon Emblem */}
      <svg
        viewBox="0 0 64 64"
        className="h-full w-auto aspect-square flex-shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <clipPath id="fh-rounded-shield">
          <rect width="64" height="64" rx="10" />
        </clipPath>
        <g clipPath="url(#fh-rounded-shield)">
          {/* Top half: Crimson Red */}
          <rect width="64" height="30" fill="#E2231A" />
          {/* Bottom half: Deep Cobalt Blue */}
          <rect y="30" width="64" height="34" fill="#004DA7" />
          {/* Horizon Arc in White cutting across */}
          <path
            d="M -10 38 Q 28 20 74 34 L 74 42 Q 28 28 -10 46 Z"
            fill="#FFFFFF"
          />
          {/* First Horizon Five-Pointed Star in Blue Field */}
          <polygon
            points="24,37 26.5,43 33,43 28,47 30,53 24,49 18,53 20,47 15,43 21.5,43"
            fill="#FFFFFF"
          />
        </g>
      </svg>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span
          className={`font-black tracking-tight text-lg sm:text-xl font-sans ${
            isLight ? "text-white" : "text-[#001F5F]"
          }`}
        >
          FIRST HORIZON
        </span>
        <span
          className={`text-[9px] uppercase tracking-[0.2em] font-bold mt-0.5 ${
            isLight ? "text-slate-300" : "text-[#004DA7]"
          }`}
        >
          BANK
        </span>
      </div>
    </div>
  );
}

export default function FirstHorizonLanding({ onOpenAuth, onOpenRegister }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState("checking");

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans flex flex-col selection:bg-[#004DA7] selection:text-white">
      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP ANNOUNCEMENT / STATUS BAR                                      */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#001F5F] text-slate-200 text-xs py-2 px-4 sm:px-8 border-b border-[#002d8a]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">First Horizon Digital Banking Core</span>
            <span className="hidden sm:inline text-slate-400">&bull;</span>
            <span className="hidden sm:inline text-slate-300">
              Two-Factor Wire Authorization &amp; Resend Email Security Active
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-300 text-[11px]">
            <span className="hidden md:inline font-mono">Routing: 021000021</span>
            <button
              onClick={onOpenAuth}
              className="text-white hover:text-red-300 transition font-bold"
            >
              Sign In
            </button>
            <span className="text-slate-500">|</span>
            <button
              onClick={onOpenRegister}
              className="text-[#E2231A] hover:text-white transition font-bold"
            >
              Open Account
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 2. MAIN HEADER (Logo, Implemented Nav, Action Buttons)                */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <FirstHorizonLogo className="h-9 sm:h-10" />
          </div>

          {/* Clean Navigation (points strictly to implemented features) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-[#001F5F]">
            <a href="#features" className="hover:text-[#004DA7] transition">
              Banking Features
            </a>
            <a href="#how-it-works" className="hover:text-[#004DA7] transition">
              How It Works
            </a>
            <a href="#security" className="hover:text-[#004DA7] transition">
              Security &amp; 2FA
            </a>
            <a href="#virtual-card" className="hover:text-[#004DA7] transition">
              Virtual Debit Card
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#001F5F] font-bold text-xs uppercase tracking-wider transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              onClick={onOpenRegister}
              className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#E2231A] hover:bg-[#c81e16] text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-red-500/20"
            >
              <span>Open Account</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:text-[#001F5F] hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 px-6 py-4 space-y-3 animate-in fade-in">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-[#001F5F]"
            >
              Banking Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-[#001F5F]"
            >
              How It Works
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-[#001F5F]"
            >
              Security &amp; 2FA
            </a>
            <a
              href="#virtual-card"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-[#001F5F]"
            >
              Virtual Debit Card
            </a>
            <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-100 text-[#001F5F] text-xs font-bold text-center"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenRegister();
                }}
                className="py-2.5 px-3 rounded-xl bg-[#E2231A] text-white text-xs font-bold text-center"
              >
                Open Account
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 3. HERO SECTION (Direct Pitch & Quick Action Portal Card)             */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-[#001F5F] via-[#003380] to-[#004DA7] text-white overflow-hidden py-16 sm:py-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E2231A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Direct Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-sky-300" />
                <span>Next-Generation Core Digital Banking</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.15]">
                Banking built for <span className="text-[#FF4A3E]">speed</span>, control, and security.
              </h1>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
                Open a digital checking account with zero monthly fees, apply for a First Horizon Platinum Virtual Visa card, and execute secure wire transfers backed by real-time Resend email verification codes.
              </p>

              {/* Direct Action Triggers */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={onOpenRegister}
                  className="inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#E2231A] hover:bg-[#c81e16] text-white font-bold text-sm tracking-wide shadow-lg shadow-red-600/30 transition transform hover:-translate-y-0.5 active:scale-95"
                >
                  Open Checking Account <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenAuth}
                  className="inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-sm tracking-wide backdrop-blur-sm transition active:scale-95"
                >
                  <Lock className="w-4 h-4" /> Sign In to Portal
                </button>
              </div>

              {/* Core Feature Metric Chips */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/15 max-w-lg">
                <div>
                  <span className="text-[11px] text-slate-300 uppercase tracking-wider block">Monthly Fee</span>
                  <span className="font-mono font-extrabold text-2xl text-white block mt-0.5">$0.00</span>
                  <span className="text-[10px] text-emerald-300 font-semibold">Zero account fee</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-300 uppercase tracking-wider block">Wire Security</span>
                  <span className="font-mono font-extrabold text-2xl text-white block mt-0.5">2FA OTP</span>
                  <span className="text-[10px] text-sky-300 font-semibold">Via Resend Email</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-300 uppercase tracking-wider block">Grace Period</span>
                  <span className="font-mono font-extrabold text-2xl text-white block mt-0.5">14 Days</span>
                  <span className="text-[10px] text-amber-300 font-semibold">Dormancy safeguard</span>
                </div>
              </div>
            </div>

            {/* Right Column: Portal Access Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-800 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#004DA7]/10 flex items-center justify-center text-[#004DA7]">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#001F5F]">Digital Banking Gateway</h3>
                      <p className="text-[11px] text-slate-500">Live Banking Core</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    System Ready
                  </span>
                </div>

                <div className="space-y-4 my-5">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Access complete core banking services: instant checking establishment, on-demand debit card application &amp; admin review, internal transfers, and external wires with 2FA email passcodes.
                  </p>

                  <div className="space-y-2.5">
                    <button
                      onClick={onOpenAuth}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#004DA7] hover:bg-[#003d85] text-white font-bold text-xs shadow-md shadow-[#004DA7]/20 transition group"
                    >
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Sign In to Existing Account
                      </span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                    </button>

                    <button
                      onClick={onOpenRegister}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#001F5F] font-bold text-xs transition group"
                    >
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#E2231A]" /> Open New Checking Account
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-[11px] text-slate-600">
                  <div className="flex items-center justify-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Virtual Visa Application
                  </div>
                  <div className="flex items-center justify-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Resend 2FA Email
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 4. REAL IMPLEMENTED FEATURES GRID                                     */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#004DA7]">
              Platform Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#001F5F] tracking-tight mt-1">
              Core Banking Features Implemented
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Everything in this banking platform is fully functional, database-backed, and wired to live transactional services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: Checking Account */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004DA7] flex items-center justify-center mb-4">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#001F5F]">Digital Checking Core</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Dedicated 10-digit account number, 9-digit federal routing transit number, and a real-time transactional balance.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#004DA7]">
                <span>$0 Minimum Balance</span>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            {/* Feature 2: Virtual Platinum Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E2231A] flex items-center justify-center mb-4">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#001F5F]">Virtual Visa Platinum</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Apply directly from your dashboard with administrative approval. Features masked 16-digit PAN, CVV, expiry, and an instant card freeze/unfreeze lock.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#004DA7]">
                <span>Instant Card Freeze</span>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            {/* Feature 3: Wire Transfers & 2FA */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#001F5F] flex items-center justify-center mb-4">
                  <Send className="w-5 h-5 text-[#004DA7]" />
                </div>
                <h3 className="font-bold text-base text-[#001F5F]">2FA Wire Transfers</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Send internal transfers instantly or wire funds to external institutions with mandatory 6-digit email OTP verification.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#004DA7]">
                <span>Resend OTP Guard</span>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            {/* Feature 4: 14-Day Dormancy Safeguard */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#001F5F]">14-Day Dormancy Policy</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Accounts unverified after 14 days automatically become dormant to protect the customer. Self-service reactivation included.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#004DA7]">
                <span>Automated Safeguard</span>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 5. HOW IT WORKS (3-Step Guided Workflow)                              */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#004DA7]">
              Simple &amp; Secure
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#001F5F] tracking-tight mt-1">
              How the Banking Experience Works
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              From registration to sending your first wire, everything is straightforward and protected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-[#001F5F] text-white font-mono font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                1
              </div>
              <h3 className="font-bold text-base text-[#001F5F]">Open Account &amp; Verify</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Provide your legal full name, email address, and password. An instant 6-digit verification code is emailed to confirm your address within 14 days.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-[#004DA7] text-white font-mono font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                2
              </div>
              <h3 className="font-bold text-base text-[#001F5F]">Manage Balance &amp; Virtual Card</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Access your dashboard, review real-time deposits, apply for a Platinum debit card, or freeze your active card with a single tap.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-[#E2231A] text-white font-mono font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                3
              </div>
              <h3 className="font-bold text-base text-[#001F5F]">Authorize Wires &amp; Review Receipts</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Initiate external wires to any bank. Review the masked summary, enter the 6-digit OTP sent via Resend, and download your transaction receipt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 6. VIRTUAL PLATINUM DEBIT CARD SPOTLIGHT                              */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <section id="virtual-card" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Card Visual */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-3xl p-6 text-white bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-2xl relative overflow-hidden select-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#004DA7]/30 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between mb-8">
                  <span className="font-bold tracking-wider text-xs text-slate-200">FIRST HORIZON</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-slate-600 px-2 py-0.5 rounded">
                    PLATINUM
                  </span>
                </div>

                <div className="w-10 h-7 rounded bg-amber-400/80 mb-6 flex items-center justify-center">
                  <div className="w-7 h-5 border border-amber-800/40 rounded-sm" />
                </div>

                <div className="font-mono text-lg font-bold tracking-[0.25em] text-white mb-6">
                  4532 &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 8891
                </div>

                <div className="flex items-end justify-between text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Cardholder</span>
                    <span className="font-bold text-white tracking-wide">ALEX MORGAN</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Expires</span>
                    <span className="font-mono font-bold text-white">09/29</span>
                  </div>
                  <span className="font-extrabold italic text-sm tracking-wider text-white">VISA</span>
                </div>
              </div>
            </div>

            {/* Right: Card Details & Capabilities */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-blue-50 border border-blue-200 text-[#004DA7] text-xs font-bold">
                <CreditCard className="w-3.5 h-3.5" /> Underwritten Digital Issuance
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#001F5F] tracking-tight">
                Control Your Virtual Visa Card in Real-Time
              </h2>

              <p className="text-slate-600 text-sm leading-relaxed">
                Apply for a First Horizon Platinum Virtual Visa card right from your dashboard. Once approved by bank administration, toggle sensitive numbers on demand and freeze or unfreeze your card instantly.
              </p>

              <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Admin-Approved Issuance:</strong> Submit a 1-click debit card application from your dashboard and receive your card upon administrative approval.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Instant Card Freeze:</strong> Lock your debit card anytime from the dashboard to immediately decline all outbound transactions.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Sensitive Data Masking:</strong> Card numbers and 3-digit CVV are masked by default and only revealed on explicit user click.
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onOpenRegister}
                  className="py-3 px-5 rounded-xl bg-[#004DA7] hover:bg-[#003882] text-white font-bold text-xs uppercase tracking-wider transition shadow-md"
                >
                  Apply for Your Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 7. SECURITY & 2FA SAFEGUARDS                                          */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <section id="security" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" /> Multi-Layered Fraud Defense
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#001F5F] tracking-tight">
                Built-In Two-Factor Security on Every Wire
              </h2>

              <p className="text-slate-600 text-sm leading-relaxed">
                We protect your capital with live one-time passcode verification powered by the Resend email service. External wires cannot execute without validating a 6-digit cryptographic token delivered directly to your verified inbox.
              </p>

              <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-50 text-[#004DA7] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="text-[#001F5F]">Resend Email Verification:</strong> High-deliverability transactional emails dispatched on signup and wire requests.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-50 text-[#004DA7] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="text-[#001F5F]">14-Day Dormancy Limit:</strong> Prevents unverified ghost accounts. Once 14 days lapse without email confirmation, accounts are marked dormant until reactivated.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-50 text-[#004DA7] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="text-[#001F5F]">In-App Secure Inbox:</strong> Real-time message drawer allows instantaneous review of security passcodes and receipts directly in browser.
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
                <Lock className="w-8 h-8 text-[#004DA7] mx-auto mb-2" />
                <h4 className="font-bold text-sm text-[#001F5F]">2FA Wire Gate</h4>
                <p className="text-[11px] text-slate-500 mt-1">3-minute timed OTP validation for external transfers.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
                <Clock className="w-8 h-8 text-[#E2231A] mx-auto mb-2" />
                <h4 className="font-bold text-sm text-[#001F5F]">14-Day Dormancy</h4>
                <p className="text-[11px] text-slate-500 mt-1">Automated account lock if unverified after 14 days.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
                <Mail className="w-8 h-8 text-[#004DA7] mx-auto mb-2" />
                <h4 className="font-bold text-sm text-[#001F5F]">Resend API</h4>
                <p className="text-[11px] text-slate-500 mt-1">Direct transactional email delivery pipeline.</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
                <Shield className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-[#001F5F]">Audit Trail</h4>
                <p className="text-[11px] text-slate-500 mt-1">Cryptographic reference IDs on every ledger entry.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 8. BOTTOM CTA BANNER                                                  */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#001F5F] via-[#004DA7] to-[#001F5F] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center space-y-4">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Experience First Horizon Digital Banking?
          </h2>
          <p className="text-slate-200 text-sm max-w-xl mx-auto">
            Open your account in seconds, verify your email, and experience modern wire transfers with 2FA passcodes.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenRegister}
              className="py-3 px-6 rounded-xl bg-[#E2231A] hover:bg-[#c81e16] text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/30 active:scale-95"
            >
              Open Your Account
            </button>
            <button
              onClick={onOpenAuth}
              className="py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95"
            >
              Sign In to Banking
            </button>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 9. FOCUSED INSTITUTIONAL FOOTER (No Dead Links)                       */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <footer className="bg-[#001438] text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <FirstHorizonLogo variant="light" className="h-8" />
            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <span>Member FDIC</span>
              <span>&bull;</span>
              <span>Equal Housing Lender</span>
              <span>&bull;</span>
              <span className="font-mono text-slate-300">Routing Transit: 021000021</span>
            </div>
          </div>

          {/* Real Action Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-[12px]">
            <div>
              <h5 className="font-bold uppercase tracking-wider text-white mb-3">Portal Navigation</h5>
              <ul className="space-y-2">
                <li>
                  <button onClick={onOpenAuth} className="hover:text-white transition font-medium">
                    Sign In to Banking
                  </button>
                </li>
                <li>
                  <button onClick={onOpenRegister} className="hover:text-white transition font-medium">
                    Open New Account
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold uppercase tracking-wider text-white mb-3">Core Features</h5>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition">Checking Core</a></li>
                <li><a href="#virtual-card" className="hover:text-white transition">Virtual Debit Card</a></li>
                <li><a href="#features" className="hover:text-white transition">2FA Wire Transfers</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold uppercase tracking-wider text-white mb-3">Security &amp; Policy</h5>
              <ul className="space-y-2">
                <li><a href="#security" className="hover:text-white transition">Two-Factor OTP Wires</a></li>
                <li><a href="#security" className="hover:text-white transition">14-Day Dormancy Limit</a></li>
                <li><a href="#security" className="hover:text-white transition">Resend Email Integration</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold uppercase tracking-wider text-white mb-3">Architecture</h5>
              <ul className="space-y-2 text-slate-400">
                <li>Vibe-GX Backend</li>
                <li>Resend Email API</li>
                <li>SQLite ACID Database</li>
              </ul>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="pt-6 border-t border-slate-800 space-y-2 text-[11px] text-slate-500 leading-relaxed">
            <p>
              &copy; {new Date().getFullYear()} First Horizon Bank. Member FDIC. Equal Housing Lender.
            </p>
            <p>
              First Horizon Bank retail checking, virtual card management, two-factor external wire authorizations, and secure verification pipelines.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
