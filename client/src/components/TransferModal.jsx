import React, { useState, useEffect } from "react";
import { ArrowUpRight, Building2, UserCheck, AlertCircle, RefreshCw, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";

const PRESET_BANKS = [
  { name: "First Horizon Bank (Affiliate)", routing: "021000021" },
  { name: "JPMorgan Chase", routing: "021000021" },
  { name: "Bank of America", routing: "026009593" },
  { name: "Wells Fargo", routing: "121000248" },
  { name: "Citibank", routing: "021000089" },
  { name: "Capital One", routing: "051405515" },
  { name: "Other Financial Institution", routing: "" },
];

export default function TransferModal({
  isOpen,
  onClose,
  currentBalance,
  onInternalSuccess,
  onExternalStaged,
}) {
  const [activeTab, setActiveTab] = useState("internal"); // "internal" | "external"

  // Internal state
  const [internalRecipient, setInternalRecipient] = useState("");
  const [verifiedName, setVerifiedName] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [internalAmount, setInternalAmount] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [internalError, setInternalError] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);

  // External state
  const [selectedBank, setSelectedBank] = useState(PRESET_BANKS[0].name);
  const [routingNumber, setRoutingNumber] = useState(PRESET_BANKS[0].routing);
  const [externalAccount, setExternalAccount] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [externalAmount, setExternalAmount] = useState("");
  const [externalNote, setExternalNote] = useState("");
  const [externalError, setExternalError] = useState("");
  const [externalLoading, setExternalLoading] = useState(false);

  // Reset errors when tab changes
  useEffect(() => {
    setInternalError("");
    setExternalError("");
  }, [activeTab]);

  // Handle bank selection
  const handleBankSelect = (e) => {
    const bankName = e.target.value;
    setSelectedBank(bankName);
    const found = PRESET_BANKS.find((b) => b.name === bankName);
    if (found && found.routing) {
      setRoutingNumber(found.routing);
    }
  };

  // Lookup internal recipient with debounce
  useEffect(() => {
    if (!internalRecipient || internalRecipient.trim().length < 5) {
      setVerifiedName(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setVerifying(true);
        setInternalError("");
        const res = await api.transfers.verifyRecipient(internalRecipient.trim());
        setVerifiedName(res.recipient_name);
      } catch (err) {
        setVerifiedName(null);
        setInternalError(err.message);
      } finally {
        setVerifying(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [internalRecipient]);

  if (!isOpen) return null;

  // Submit Internal
  const handleInternalSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(internalAmount);
    if (!amt || amt <= 0) {
      setInternalError("Please enter a valid transfer amount");
      return;
    }
    if (amt > currentBalance) {
      setInternalError(`Amount exceeds available balance ($${currentBalance.toFixed(2)})`);
      return;
    }

    try {
      setInternalLoading(true);
      setInternalError("");
      const res = await api.transfers.internal({
        recipient_account_number: internalRecipient.trim(),
        amount: amt,
        description: internalNote.trim() || "First Horizon Direct Transfer",
      });
      onInternalSuccess(res);
      onClose();
    } catch (err) {
      setInternalError(err.message || "Failed to process transfer");
    } finally {
      setInternalLoading(false);
    }
  };

  // Submit External Stage
  const handleExternalSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(externalAmount);
    if (!amt || amt <= 0) {
      setExternalError("Please enter a valid transfer amount");
      return;
    }
    if (amt + 2.50 > currentBalance) {
      setExternalError(
        `Insufficient funds. Available: $${currentBalance.toFixed(2)}, required with $2.50 fee: $${(
          amt + 2.50
        ).toFixed(2)}`
      );
      return;
    }

    try {
      setExternalLoading(true);
      setExternalError("");
      const res = await api.transfers.externalInitiate({
        bank_name: selectedBank,
        routing_number: routingNumber.trim(),
        account_number: externalAccount.trim(),
        beneficiary_name: beneficiaryName.trim(),
        amount: amt,
        description: externalNote.trim() || "First Horizon External Wire",
      });
      onExternalStaged(res);
      onClose();
    } catch (err) {
      setExternalError(err.message || "Failed to initiate wire transfer");
    } finally {
      setExternalLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden text-slate-800">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#004DA7]">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#001F5F]">Transfer Funds</h3>
              <p className="text-xs text-slate-500">
                Available Balance:{" "}
                <span className="font-mono font-bold text-emerald-700">
                  ${currentBalance?.toFixed(2) || "0.00"} USD
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 my-4 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("internal")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              activeTab === "internal"
                ? "bg-[#004DA7] text-white shadow-sm"
                : "text-slate-600 hover:text-[#001F5F]"
            }`}
          >
            <UserCheck className="w-4 h-4" /> Within First Horizon
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("external")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
              activeTab === "external"
                ? "bg-[#004DA7] text-white shadow-sm"
                : "text-slate-600 hover:text-[#001F5F]"
            }`}
          >
            <Building2 className="w-4 h-4" /> Outside Bank (Wire)
          </button>
        </div>

        {/* TAB 1: INTERNAL TRANSFER */}
        {activeTab === "internal" && (
          <form onSubmit={handleInternalSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Recipient Account # or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={internalRecipient}
                  onChange={(e) => setInternalRecipient(e.target.value)}
                  placeholder="e.g. 1041520012 or customer@example.com"
                  className="w-full text-sm font-mono py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white outline-none transition"
                />
                {verifying && (
                  <div className="absolute right-3.5 top-3">
                    <RefreshCw className="w-4 h-4 text-[#004DA7] animate-spin" />
                  </div>
                )}
              </div>

              {/* Verified badge */}
              {verifiedName && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Beneficiary: <strong>{verifiedName}</strong></span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="25000"
                  required
                  value={internalAmount}
                  onChange={(e) => setInternalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 text-lg font-mono font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Memo / Note (Optional)
              </label>
              <input
                type="text"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="What's this for?"
                className="w-full text-sm py-2 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white outline-none transition"
              />
            </div>

            {internalError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{internalError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={internalLoading || !internalRecipient || !internalAmount}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#E2231A] hover:bg-[#c81e16] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#E2231A]/20 transition"
            >
              {internalLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Send Instant Transfer"}
            </button>
          </form>
        )}

        {/* TAB 2: EXTERNAL WIRE TRANSFER */}
        {activeTab === "external" && (
          <form onSubmit={handleExternalSubmit} className="space-y-3.5">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-[#001F5F]">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-[#004DA7] mt-0.5" />
              <span>External wire transfers require two-factor Email OTP verification dispatched to your registered address. Wire fee: <strong>$2.50 USD</strong>.</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Recipient Bank
                </label>
                <select
                  value={selectedBank}
                  onChange={handleBankSelect}
                  className="w-full text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:border-[#004DA7] focus:bg-white outline-none transition"
                >
                  {PRESET_BANKS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Routing (9 digits)
                </label>
                <input
                  type="text"
                  required
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  placeholder="9 digits"
                  className="w-full text-xs font-mono py-2 px-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Beneficiary Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  placeholder="e.g. Johnathan Smith"
                  className="w-full text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  required
                  value={externalAccount}
                  onChange={(e) => setExternalAccount(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full text-xs font-mono py-2 px-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Wire Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="5"
                  required
                  value={externalAmount}
                  onChange={(e) => setExternalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2 text-base font-mono font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white outline-none transition"
                />
              </div>
            </div>

            {externalError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{externalError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={externalLoading || !beneficiaryName || !externalAccount || !externalAmount}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#004DA7] hover:bg-[#003882] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs uppercase tracking-wider shadow-md transition"
            >
              {externalLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                "Continue to Email OTP Authorization"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
