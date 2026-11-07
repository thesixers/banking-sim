import React, { useState } from "react";
import { PlusCircle, RefreshCw, X, Sparkles, DollarSign } from "lucide-react";
import { api } from "../services/api";

const PRESET_AMOUNTS = [250, 500, 1000, 2500];

export default function FaucetModal({ isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState(500);
  const [label, setLabel] = useState("Payroll Direct Deposit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await api.accounts.faucet({
        amount: num,
        label: label.trim() || "Sandbox Faucet Deposit",
      });
      onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add funds");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-navy-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sandbox Faucet</h3>
              <p className="text-xs text-slate-400">Add Mock Funds for Testing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Quick Amount
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition border ${
                    amount === amt
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm"
                      : "bg-navy-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  +${amt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Deposit Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-500 font-mono font-bold">$</span>
              <input
                type="number"
                min="10"
                max="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3.5 py-3 text-lg font-mono font-bold rounded-xl bg-navy-950 border border-slate-700 text-white placeholder-slate-600 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Deposit Label */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Transaction Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Weekly Paycheck, Bonus"
              className="w-full text-xs py-2.5 px-3.5 rounded-xl bg-navy-950 border border-slate-700 text-white placeholder-slate-600 focus:border-emerald-500 outline-none transition"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold shadow-lg shadow-emerald-600/20 transition"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Deposit Test Funds"}
          </button>
        </form>
      </div>
    </div>
  );
}
