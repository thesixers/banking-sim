import React, { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Building2, RefreshCw, Sparkles, Filter, Receipt } from "lucide-react";

export default function TransactionList({ transactions, loading, onSelectTransaction }) {
  const [filter, setFilter] = useState("ALL"); // ALL | INFLOW | OUTFLOW | EXTERNAL | INTERNAL

  const filtered = (transactions || []).filter((tx) => {
    if (filter === "ALL") return true;
    if (filter === "INFLOW") return tx.direction === "INFLOW";
    if (filter === "OUTFLOW") return tx.direction === "OUTFLOW";
    if (filter === "EXTERNAL") return tx.type === "EXTERNAL";
    if (filter === "INTERNAL") return tx.type === "INTERNAL";
    return true;
  });

  return (
    <div className="bg-navy-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
      {/* Header & Filter pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-white">Activity Ledger</h3>
          <p className="text-xs text-slate-400">Complete transaction history & receipts</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "INFLOW", "OUTFLOW", "EXTERNAL", "INTERNAL"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition ${
                filter === f
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-navy-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {f === "ALL" ? "All Activity" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="mt-4 divide-y divide-slate-800/60">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-brand-400" />
            <span className="text-xs">Loading ledger...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No transactions found</p>
            <p className="text-xs text-slate-500 mt-1">Make a transfer or deposit to view activity.</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const isOutflow = tx.direction === "OUTFLOW";
            const isExternal = tx.type === "EXTERNAL";
            const isFaucet = tx.type === "FAUCET";

            return (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className="py-3.5 px-3 rounded-2xl flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition group"
              >
                {/* Left: Icon & Details */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                      isFaucet
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : isExternal
                        ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                        : isOutflow
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {isFaucet ? (
                      <Sparkles className="w-4 h-4" />
                    ) : isExternal ? (
                      <Building2 className="w-4 h-4" />
                    ) : isOutflow ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-brand-300 transition">
                      {isFaucet
                        ? tx.description
                        : isExternal
                        ? `Wire: ${tx.external_bank_details?.beneficiary_name || "External Transfer"}`
                        : isOutflow
                        ? `Sent to ${tx.recipient_name || "Internal Beneficiary"}`
                        : `Received from ${tx.sender_name || "Sender"}`}
                    </h4>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-slate-400">{tx.reference_id}</span>
                      {isExternal && (
                        <>
                          <span>•</span>
                          <span className="text-[10px] text-brand-400">
                            {tx.external_bank_details?.bank_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Status */}
                <div className="text-right">
                  <div
                    className={`font-mono font-bold text-xs sm:text-sm ${
                      isOutflow ? "text-slate-100" : "text-emerald-400"
                    }`}
                  >
                    {isOutflow ? "-" : "+"}${Number(tx.amount).toFixed(2)}
                  </div>
                  {tx.fee > 0 && (
                    <p className="text-[10px] text-slate-500 font-mono">
                      fee: ${Number(tx.fee).toFixed(2)}
                    </p>
                  )}
                  <span
                    className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                      tx.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : tx.status === "PENDING_OTP"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
