import React, { useState } from "react";
import { DollarSign, PlusCircle, MinusCircle, RefreshCw, X, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";

export default function AdjustBalanceModal({ isOpen, onClose, customer, onSuccess }) {
  const [action, setAction] = useState("CREDIT"); // "CREDIT" | "DEBIT" | "SET"
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("Administrative Liquidity Grant");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !customer) return null;

  const currentBalance = Number(customer.balance || 0);
  const numAmount = Number(amount) || 0;

  let calculatedNewBalance = currentBalance;
  if (action === "CREDIT") calculatedNewBalance = currentBalance + numAmount;
  else if (action === "DEBIT") calculatedNewBalance = Math.max(0, currentBalance - numAmount);
  else if (action === "SET") calculatedNewBalance = Math.max(0, numAmount);

  const presets = [
    { label: "+$500", amt: 500, act: "CREDIT" },
    { label: "+$1,000", amt: 1000, act: "CREDIT" },
    { label: "+$10,000", amt: 10000, act: "CREDIT" },
    { label: "+$50,000", amt: 50000, act: "CREDIT" },
    { label: "+$100,000", amt: 100000, act: "CREDIT" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isNaN(numAmount) || (action !== "SET" && numAmount <= 0) || (action === "SET" && numAmount < 0)) {
      setError("Please enter a valid amount");
      return;
    }

    if (action === "DEBIT" && numAmount > currentBalance) {
      setError(`Cannot debit $${numAmount.toFixed(2)}. Available customer balance is $${currentBalance.toFixed(2)}.`);
      return;
    }

    try {
      setLoading(true);
      const res = await api.admin.adjustBalance(customer.id, {
        action,
        amount: numAmount,
        reason: reason.trim() || "Administrative Balance Adjustment",
      });
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to adjust balance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Brand Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#001F5F] via-[#004DA7] to-[#E2231A]" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#004DA7]/10 border border-[#004DA7]/20 flex items-center justify-center text-[#004DA7]">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#001F5F]">Adjust Customer Balance</h3>
              <p className="text-xs text-slate-500">First Horizon Treasury Liquidity Controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Target Pill */}
        <div className="my-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Customer</span>
            <span className="text-sm font-bold text-[#001F5F] block">{customer.full_name}</span>
            <span className="text-xs font-mono text-slate-600">{customer.email} • Acc #{customer.account_number}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Current Balance</span>
            <span className="text-lg font-mono font-extrabold text-[#001F5F]">
              ${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Action Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 mb-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAction("CREDIT")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              action === "CREDIT" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Credit (Add)
          </button>
          <button
            type="button"
            onClick={() => setAction("DEBIT")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              action === "DEBIT" ? "bg-[#E2231A] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5" /> Debit (Deduct)
          </button>
          <button
            type="button"
            onClick={() => setAction("SET")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              action === "SET" ? "bg-[#004DA7] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Set Exact
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
          <span className="text-[11px] text-slate-500 font-bold uppercase flex-shrink-0 mr-1">Presets:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setAction(p.act);
                setAmount(p.amt.toString());
              }}
              className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-mono font-bold text-slate-700 transition flex-shrink-0"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Adjustment Amount ($ USD)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-lg font-bold">
                $
              </div>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000.00"
                className="w-full text-lg font-mono font-bold py-3 pl-8 pr-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white focus:ring-2 focus:ring-[#004DA7]/15 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Reason / Ledger Memo
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Federal Wire Deposit, Manual Liquidity Grant"
              className="w-full text-xs py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white outline-none transition"
            />
          </div>

          {/* New Balance Preview Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <span className="text-emerald-900 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> New Account Balance:
            </span>
            <span className="font-mono text-base font-extrabold text-emerald-800">
              ${calculatedNewBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-[#001F5F] hover:bg-[#001438] disabled:bg-slate-300 text-xs font-bold text-white shadow-md shadow-[#001F5F]/20 transition"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  Confirm Balance Adjustment <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
