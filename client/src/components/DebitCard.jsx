import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ShieldCheck,
  Copy,
  Check,
  CreditCard,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { api } from "../services/api";

export default function DebitCard({ account, onUpdate }) {
  const [showDetails, setShowDetails] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");

  if (!account) return null;

  const cardStatus = account.card_status || (account.card_number ? "ACTIVE" : "NONE");
  const isFrozen = account.is_frozen === 1;

  const handleToggleFreeze = async () => {
    try {
      setFreezing(true);
      await api.accounts.toggleFreeze();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.message || "Failed to update card status");
    } finally {
      setFreezing(false);
    }
  };

  const handleApplyForCard = async () => {
    try {
      setApplying(true);
      setApplyError("");
      setApplySuccess("");
      await api.accounts.applyForCard();
      setApplySuccess("Application submitted! Awaiting administrator approval.");
      if (onUpdate) onUpdate();
    } catch (err) {
      setApplyError(err.message || "Failed to submit card application");
    } finally {
      setApplying(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // STATE 1: PENDING APPROVAL (User applied, waiting for admin approval)
  // ───────────────────────────────────────────────────────────────────────────
  if (cardStatus === "PENDING") {
    return (
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <div className="relative w-full aspect-[1.586/1] rounded-2xl p-6 text-white shadow-xl overflow-hidden border border-amber-500/40 bg-gradient-to-br from-[#001F5F] via-[#002b70] to-[#003882] flex flex-col justify-between">
          {/* Subtle Ambient Light */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex-shrink-0 overflow-hidden flex flex-col border border-white/20">
                <div className="w-full h-1/2 bg-[#E2231A]" />
                <div className="w-full h-1/2 bg-[#004DA7] flex items-center justify-center">
                  <span className="text-[7px] text-white font-bold leading-none">&#9733;</span>
                </div>
              </div>
              <div>
                <span className="font-extrabold text-xs sm:text-sm tracking-wider text-white block leading-tight">
                  FIRST HORIZON
                </span>
                <span className="text-[8px] uppercase tracking-[0.2em] font-semibold text-slate-300 block">
                  Platinum Debit
                </span>
              </div>
            </div>

            <span className="flex items-center gap-1.5 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
              <Clock className="w-3 h-3" /> Awaiting Approval
            </span>
          </div>

          {/* Body */}
          <div className="relative my-auto py-2 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center mx-auto mb-1">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">Card Application Under Review</h4>
            <p className="text-[11px] text-slate-300 max-w-xs mx-auto leading-relaxed">
              Your request for a First Horizon Platinum Virtual Visa card has been received. An administrator must approve your application before card details are issued.
            </p>
          </div>

          {/* Footer */}
          <div className="relative flex items-center justify-between text-[10px] text-slate-300 pt-2 border-t border-white/10">
            <span>Status: <strong>Under Review</strong></span>
            <button
              onClick={onUpdate}
              className="inline-flex items-center gap-1 text-[#FF4A3E] hover:text-white font-semibold transition"
            >
              <RefreshCw className="w-3 h-3" /> Refresh Status
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-xs text-amber-800 font-medium">
            Card Application Recieved awaiting Aproval
          </p>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STATE 2: NOT ISSUED / NOT REQUESTED / REJECTED (Show "Apply for Card" CTA)
  // ───────────────────────────────────────────────────────────────────────────
  if (cardStatus !== "ACTIVE" || !account.card_number) {
    const isRejected = cardStatus === "REJECTED";

    return (
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {/* Placeholder Shell styled to match Platinum card geometry */}
        <div className="relative w-full aspect-[1.586/1] rounded-2xl p-6 text-white shadow-xl overflow-hidden border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#004DA7]/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex-shrink-0 overflow-hidden flex flex-col border border-white/20">
                <div className="w-full h-1/2 bg-[#E2231A]" />
                <div className="w-full h-1/2 bg-[#004DA7] flex items-center justify-center">
                  <span className="text-[7px] text-white font-bold leading-none">&#9733;</span>
                </div>
              </div>
              <div>
                <span className="font-extrabold text-xs sm:text-sm tracking-wider text-white block leading-tight">
                  FIRST HORIZON
                </span>
                <span className="text-[8px] uppercase tracking-[0.2em] font-semibold text-slate-400 block">
                  Platinum Debit
                </span>
              </div>
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-300 border border-white/15 px-2 py-0.5 rounded-full">
              {isRejected ? "Declined" : "Not Issued"}
            </span>
          </div>

          {/* Card Mockup Outline */}
          <div className="relative my-auto text-center py-2 space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-slate-300 mx-auto mb-1">
              <CreditCard className="w-5 h-5 text-sky-400" />
            </div>
            <h4 className="font-bold text-sm text-white">First Horizon Platinum Visa</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed max-w-xs mx-auto">
              Cards are not issued automatically on signup. Submit an application to request your personalized virtual debit card.
            </p>
          </div>

          {/* Bottom VISA logo placeholder */}
          <div className="relative flex items-center justify-between text-xs pt-1 border-t border-white/10">
            <span className="text-[10px] text-slate-400">Requires Admin Approval</span>
            <span className="italic font-black text-sm tracking-wider text-white">VISA</span>
          </div>
        </div>

        {/* Apply Button & Info */}
        <div className="space-y-2">
          {applyError && (
            <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{applyError}</span>
            </div>
          )}

          {applySuccess && (
            <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{applySuccess}</span>
            </div>
          )}

          <button
            onClick={handleApplyForCard}
            disabled={applying}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#004DA7] hover:bg-[#003882] disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#004DA7]/20 transition active:scale-[0.98]"
          >
            {applying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting Request...
              </>
            ) : (
              <>
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isRejected ? "Re-Apply for Debit Card" : "Apply for Debit Card"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-500 text-center">
            {isRejected
              ? "Your previous application was declined. You can submit a new application for review."
              : "Zero liability & instant card freeze included with approved card."}
          </p>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STATE 3: ACTIVE ISSUED CARD (User's application approved by administrator)
  // ───────────────────────────────────────────────────────────────────────────
  const cardNum = account?.card_number || "4532 0000 0000 0000";

  const copyCardNumber = () => {
    navigator.clipboard?.writeText(cardNum.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedCardNumber = showDetails
    ? cardNum
    : `•••• •••• •••• ${cardNum.slice(-4)}`;

  return (
    <div className="flex flex-col gap-3 w-full max-w-sm">
      {/* First Horizon Platinum Virtual Visa Card */}
      <div
        className={`relative w-full aspect-[1.586/1] rounded-2xl p-6 text-white shadow-xl overflow-hidden transition-all duration-300 border ${
          isFrozen
            ? "bg-slate-700 border-slate-600 opacity-80 grayscale"
            : "card-gradient border-[#004DA7]/40 shadow-[#001F5F]/20"
        }`}
      >
        {/* Subtle Decorative Horizon Arc Watermark in Card Background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <path d="M -10 60 Q 50 20 110 50 L 110 65 Q 50 35 -10 75 Z" fill="#E2231A" />
            <path d="M -10 70 Q 50 30 110 60 L 110 75 Q 50 45 -10 85 Z" fill="#FFFFFF" />
          </svg>
        </div>

        {/* Top Row: First Horizon Brand & Status Badge */}
        <div className="relative flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex-shrink-0 overflow-hidden flex flex-col border border-white/20">
              <div className="w-full h-1/2 bg-[#E2231A]" />
              <div className="w-full h-1/2 bg-[#004DA7] flex items-center justify-center">
                <span className="text-[7px] text-white font-bold leading-none">&#9733;</span>
              </div>
            </div>
            <div>
              <span className="font-extrabold text-xs sm:text-sm tracking-wider text-white block leading-tight">
                FIRST HORIZON
              </span>
              <span className="text-[8px] uppercase tracking-[0.2em] font-semibold text-slate-300 block">
                Platinum Debit
              </span>
            </div>
          </div>

          {isFrozen ? (
            <span className="flex items-center gap-1 text-[10px] bg-rose-500/30 text-rose-200 border border-rose-500/50 px-2 py-0.5 rounded-full font-bold">
              <Lock className="w-3 h-3" /> Card Frozen
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              <ShieldCheck className="w-3 h-3" /> Active
            </span>
          )}
        </div>

        {/* EMV Gold Chip & Contactless Indicator */}
        <div className="relative flex items-center justify-between mb-3">
          <div className="w-9 h-6 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 border border-amber-500/40 shadow-inner flex flex-col justify-around p-1">
            <div className="w-full h-[1px] bg-amber-600/40" />
            <div className="w-full h-[1px] bg-amber-600/40" />
          </div>
          <svg className="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 16.5a5 5 0 010-9m3.5 11a8 8 0 000-13m3.5 15a11 11 0 000-17" />
          </svg>
        </div>

        {/* 16-Digit Card Number */}
        <div className="relative mb-3">
          <span className="font-mono text-base sm:text-lg font-bold tracking-widest text-white drop-shadow">
            {maskedCardNumber}
          </span>
        </div>

        {/* Bottom Row: Expiry, CVV & Visa Logo */}
        <div className="relative flex items-end justify-between mt-auto pt-1">
          <div className="flex items-center gap-5">
            <div>
              <p className="text-[8px] uppercase tracking-wider text-slate-300 font-bold">Expires</p>
              <p className="font-mono text-xs font-bold text-white">{account.card_expiry}</p>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-wider text-slate-300 font-bold">CVV</p>
              <p className="font-mono text-xs font-bold text-white">
                {showDetails ? account.card_cvv : "•••"}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="italic font-black text-lg tracking-tighter text-white">
              VISA
            </span>
          </div>
        </div>
      </div>

      {/* Card Quick Actions */}
      <div className="flex items-center gap-2 w-full max-w-sm">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-slate-200 hover:border-[#004DA7] text-xs text-slate-700 hover:text-[#004DA7] font-semibold transition shadow-sm"
        >
          {showDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showDetails ? "Hide Numbers" : "Reveal Card"}
        </button>

        <button
          onClick={copyCardNumber}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-slate-200 hover:border-[#004DA7] text-xs text-slate-700 hover:text-[#004DA7] font-semibold transition shadow-sm"
          title="Copy Card Number"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>

        <button
          onClick={handleToggleFreeze}
          disabled={freezing}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition border shadow-sm ${
            isFrozen
              ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              : "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100"
          }`}
        >
          {isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          {isFrozen ? "Unfreeze" : "Freeze Card"}
        </button>
      </div>
    </div>
  );
}
