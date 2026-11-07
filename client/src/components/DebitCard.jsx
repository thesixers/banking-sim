import React, { useState } from "react";
import { CreditCard, Eye, EyeOff, Lock, Unlock, ShieldCheck, Copy, Check } from "lucide-react";
import { api } from "../services/api";

export default function DebitCard({ account, onUpdate }) {
  const [showDetails, setShowDetails] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!account) return null;

  const isFrozen = account.is_frozen === 1;

  const handleToggleFreeze = async () => {
    try {
      setFreezing(true);
      const res = await api.accounts.toggleFreeze();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setFreezing(false);
    }
  };

  const cardNum = account?.card_number || "4532 0000 0000 0000";

  const copyCardNumber = () => {
    navigator.clipboard?.writeText(cardNum.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mask card number if showDetails is false
  const maskedCardNumber = showDetails
    ? cardNum
    : `•••• •••• •••• ${cardNum.slice(-4)}`;

  return (
    <div className="flex flex-col gap-3">
      {/* Virtual Card Canvas */}
      <div
        className={`relative w-full max-w-sm aspect-[1.586/1] rounded-2xl p-6 text-white shadow-2xl overflow-hidden transition-all duration-300 border ${
          isFrozen
            ? "bg-slate-800 border-slate-700 opacity-75 grayscale"
            : "card-gradient border-indigo-400/30 shadow-indigo-900/30"
        }`}
      >
        {/* Background glow effects */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />

        {/* Top row: Brand & Status */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
              NOVA PLATINUM
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-white/15 px-2 py-0.5 rounded-full text-indigo-100">
              Debit
            </span>
          </div>

          {isFrozen ? (
            <span className="flex items-center gap-1 text-[11px] bg-rose-500/30 text-rose-200 border border-rose-500/50 px-2 py-0.5 rounded-full font-medium">
              <Lock className="w-3 h-3" /> Frozen
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
              <ShieldCheck className="w-3 h-3" /> Active
            </span>
          )}
        </div>

        {/* EMV Chip & Contactless indicator */}
        <div className="relative flex items-center justify-between mb-4">
          <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 border border-amber-500/40 shadow-inner flex flex-col justify-around p-1">
            <div className="w-full h-[1px] bg-amber-600/40" />
            <div className="w-full h-[1px] bg-amber-600/40" />
          </div>
          <svg className="w-6 h-6 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 16.5a5 5 0 010-9m3.5 11a8 8 0 000-13m3.5 15a11 11 0 000-17" />
          </svg>
        </div>

        {/* Card Number */}
        <div className="relative mb-4">
          <span className="font-mono text-lg sm:text-xl font-bold tracking-widest text-slate-100 drop-shadow">
            {maskedCardNumber}
          </span>
        </div>

        {/* Bottom row: Expiry, CVV & Visa */}
        <div className="relative flex items-end justify-between mt-auto">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-indigo-200 font-semibold">Valid Thru</p>
              <p className="font-mono text-xs font-bold text-white">{account.card_expiry}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-indigo-200 font-semibold">CVV</p>
              <p className="font-mono text-xs font-bold text-white">
                {showDetails ? account.card_cvv : "•••"}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="italic font-black text-xl tracking-tighter text-white/95">
              VISA
            </span>
          </div>
        </div>
      </div>

      {/* Card Quick Actions */}
      <div className="flex items-center gap-2 max-w-sm">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium transition"
        >
          {showDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showDetails ? "Hide Details" : "Reveal Card"}
        </button>

        <button
          onClick={copyCardNumber}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium transition"
          title="Copy Card Number"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>

        <button
          onClick={handleToggleFreeze}
          disabled={freezing}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition border ${
            isFrozen
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
          }`}
        >
          {isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          {isFrozen ? "Unfreeze" : "Freeze"}
        </button>
      </div>
    </div>
  );
}
