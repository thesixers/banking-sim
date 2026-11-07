import React, { useState } from "react";
import { CheckCircle2, Copy, Check, X, ShieldCheck, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function TransactionReceiptModal({ isOpen, onClose, data }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const copyRef = () => {
    navigator.clipboard?.writeText(data.reference_id || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOutflow = data.direction === "OUTFLOW" || data.status === "COMPLETED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-navy-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon Badge */}
        <div className="flex flex-col items-center text-center pt-2 pb-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Transfer Completed</h3>
          <p className="text-xs text-slate-400 mt-1">Transaction successfully processed & recorded</p>

          <div className="mt-4 font-mono font-extrabold text-3xl text-white">
            ${Number(data.amount || 0).toFixed(2)}
          </div>
          {data.fee > 0 && (
            <span className="text-xs text-slate-400 mt-1">
              + ${Number(data.fee).toFixed(2)} wire fee
            </span>
          )}
        </div>

        {/* Receipt Details Card */}
        <div className="bg-navy-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>Reference ID</span>
            <div className="flex items-center gap-1.5 font-mono text-slate-200">
              <span>{data.reference_id}</span>
              <button
                onClick={copyRef}
                className="p-1 hover:text-brand-400 text-slate-500 transition"
                title="Copy Reference"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {data.recipient_name && (
            <div className="flex justify-between text-slate-400">
              <span>Beneficiary</span>
              <span className="font-semibold text-white">{data.recipient_name}</span>
            </div>
          )}

          {data.recipient_account && (
            <div className="flex justify-between text-slate-400">
              <span>Destination Account</span>
              <span className="font-mono text-slate-300">{data.recipient_account}</span>
            </div>
          )}

          {data.external_bank_details?.bank_name && (
            <div className="flex justify-between text-slate-400">
              <span>Destination Bank</span>
              <span className="text-slate-300">{data.external_bank_details.bank_name}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-400">
            <span>Payment Method</span>
            <span className="text-slate-300">Nova Bank Online Wire</span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>Timestamp</span>
            <span className="text-slate-300">
              {data.created_at ? new Date(data.created_at).toLocaleString() : new Date().toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">Status</span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" /> COMPLETED
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
