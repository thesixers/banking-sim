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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-navy-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-brand-500 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Adjust Customer Balance</h3>
              <p className="text-xs text-slate-400">Master Administrative Vault Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Target Pill */}
        <div className="my-4 p-4 rounded-2xl bg-navy-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Customer</span>
            <span className="text-sm font-bold text-white block">{customer.full_name}</span>
            <span className="text-xs font-mono text-slate-400">{customer.email} • Acc #{customer.account_number}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Current Balance</span>
            <span className="text-lg font-mono font-extrabold text-white">
              ${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Action Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 mb-4 bg-navy-950 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAction("CREDIT")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              action === "CREDIT" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Credit (Add)
          </button>
          <button
            type="button"
            onClick={() => setAction("DEBIT")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              action === "DEBIT" ? "bg-rose-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5" /> Debit (Deduct)
          </button>
          <button
            type="button"
            onClick={() => setAction("SET")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              action === "SET" ? "bg-brand-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Set Exact
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
          <span className="text-[11px] text-slate-500 font-semibold uppercase flex-shrink-0 mr-1">Presets:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setAction(p.act);
                setAmount(p.amt.toString());
              }}
              className="py-1 px-2.5 rounded-lg bg-navy-950 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-medium text-slate-300 hover:text-white transition flex-shrink-0"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Adjustment Amount ($ USD)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-lg">
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
                className="w-full text-lg font-mono font-bold py-3 pl-8 pr-4 rounded-xl bg-navy-950 border border-slate-700 text-white placeholder-slate-600 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Reason / Ledger Memo
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Federal Wire Deposit, Manual Liquidity Grant"
              className="w-full text-xs py-2.5 px-3.5 rounded-xl bg-navy-950 border border-slate-700 text-white placeholder-slate-600 focus:border-brand-500 outline-none transition"
            />
          </div>

          {/* New Balance Preview Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
            <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> New Account Balance:
            </span>
            <span className="font-mono text-base font-extrabold text-emerald-300">
              ${calculatedNewBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition"
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
