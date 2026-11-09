import React, { useState } from "react";
import { CheckCircle2, Copy, Check, X, ShieldCheck, Printer } from "lucide-react";
import { FirstHorizonLogo } from "./FirstHorizonLanding";

export default function TransactionReceiptModal({ isOpen, onClose, data }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const copyRef = () => {
    navigator.clipboard?.writeText(data.reference_id || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Top Brand Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#001F5F] via-[#004DA7] to-[#E2231A]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with First Horizon Logo and Checkmark */}
        <div className="flex flex-col items-center text-center pt-2 pb-4">
          <div className="flex justify-center mb-4">
            <FirstHorizonLogo variant="default" className="h-7" />
          </div>

          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3 shadow-md shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-[#001F5F]">Wire Transfer Completed</h3>
          <p className="text-xs text-slate-500 mt-1">Transaction recorded on First Horizon Core Ledger</p>

          <div className="mt-4 font-mono font-extrabold text-3xl text-[#001F5F]">
            ${Number(data.amount || 0).toFixed(2)}
          </div>
          {data.fee > 0 && (
            <span className="text-xs text-slate-500 mt-1 font-medium">
              + ${Number(data.fee).toFixed(2)} institutional wire fee
            </span>
          )}
        </div>

        {/* Receipt Details Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center text-slate-500">
            <span>Reference ID</span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
              <span>{data.reference_id}</span>
              <button
                onClick={copyRef}
                className="p-1 hover:text-[#004DA7] text-slate-400 transition"
                title="Copy Reference"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {data.recipient_name && (
            <div className="flex justify-between text-slate-500">
              <span>Beneficiary</span>
              <span className="font-bold text-slate-900">{data.recipient_name}</span>
            </div>
          )}

          {data.recipient_account && (
            <div className="flex justify-between text-slate-500">
              <span>Destination Account</span>
              <span className="font-mono font-semibold text-slate-800">{data.recipient_account}</span>
            </div>
          )}

          {data.external_bank_details?.bank_name && (
            <div className="flex justify-between text-slate-500">
              <span>Destination Institution</span>
              <span className="font-medium text-slate-800">{data.external_bank_details.bank_name}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-500">
            <span>Payment Method</span>
            <span className="font-medium text-slate-800">First Horizon Online Wire</span>
          </div>

          <div className="flex justify-between text-slate-500">
            <span>Timestamp</span>
            <span className="text-slate-800 font-medium">
              {data.created_at ? new Date(data.created_at).toLocaleString() : new Date().toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
            <span className="text-slate-500 font-semibold">Status</span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> COMPLETED &amp; SETTLED
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print Receipt
          </button>
          <button
            onClick={onClose}
            className="py-3 rounded-xl bg-[#001F5F] hover:bg-[#001438] text-white font-bold text-xs transition shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
