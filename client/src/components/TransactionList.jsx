import React, { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Building2, RefreshCw, Receipt } from "lucide-react";

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
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
      {/* Header & Filter pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-[#001F5F]">Transaction Activity Ledger</h3>
          <p className="text-xs text-slate-500">Official statement records &amp; wire confirmations</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "INFLOW", "OUTFLOW", "EXTERNAL", "INTERNAL"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap ${
                filter === f
                  ? "bg-[#004DA7] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              {f === "ALL" ? "All Activity" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="mt-3 divide-y divide-slate-100">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-[#004DA7]" />
            <span className="text-xs font-medium">Retrieving activity from First Horizon core...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
            <p className="text-sm font-semibold text-slate-700">No transactions found</p>
            <p className="text-xs text-slate-400 mt-1">Make a deposit or initiate a wire transfer to see activity.</p>
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
                className="py-3.5 px-3 rounded-2xl flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition group"
              >
                {/* Left: Icon & Details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                      isExternal
                        ? "bg-blue-50 border-blue-200 text-[#004DA7]"
                        : isOutflow
                        ? "bg-slate-100 border-slate-200 text-slate-700"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700"
                    }`}
                  >
                    {isExternal ? (
                      <Building2 className="w-4 h-4" />
                    ) : isOutflow ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#001F5F] group-hover:text-[#004DA7] transition truncate">
                      {isFaucet
                        ? tx.description
                        : isExternal
                        ? `Wire: ${tx.external_bank_details?.beneficiary_name || "External Beneficiary"}`
                        : isOutflow
                        ? `Sent to ${tx.recipient_name || "Internal Customer"}`
                        : `Received from ${tx.sender_name || "Sender"}`}
                    </h4>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 flex-wrap">
                      <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                      <span>&bull;</span>
                      <span className="font-mono text-[10px] text-slate-600 font-semibold">{tx.reference_id}</span>
                      {isExternal && (
                        <>
                          <span>&bull;</span>
                          <span className="text-[10px] text-[#004DA7] font-semibold">
                            {tx.external_bank_details?.bank_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Status */}
                <div className="text-right flex-shrink-0 pl-3">
                  <div
                    className={`font-mono font-extrabold text-xs sm:text-sm ${
                      isOutflow ? "text-slate-900" : "text-emerald-700"
                    }`}
                  >
                    {isOutflow ? "-" : "+"}${Number(tx.amount).toFixed(2)}
                  </div>
                  {tx.fee > 0 && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      fee: ${Number(tx.fee).toFixed(2)}
                    </p>
                  )}
                  <span
                    className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 border ${
                      tx.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : tx.status === "PENDING_OTP"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
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
