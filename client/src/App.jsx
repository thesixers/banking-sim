import React, { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import AuthView from "./components/AuthView";
import DebitCard from "./components/DebitCard";
import TransferModal from "./components/TransferModal";
import OtpVerificationModal from "./components/OtpVerificationModal";
import TransactionReceiptModal from "./components/TransactionReceiptModal";
import FaucetModal from "./components/FaucetModal";
import VirtualInboxDrawer from "./components/VirtualInboxDrawer";
import TransactionList from "./components/TransactionList";
import AdminPanel from "./components/AdminPanel";
import { api } from "./services/api";
import {
  Building2,
  ArrowUpRight,
  PlusCircle,
  Mail,
  LogOut,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  Wallet,
} from "lucide-react";

export default function App() {
  const { user, account, loading: authLoading, logout, refreshAccount } = useAuth();

  // Modals state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isFaucetOpen, setIsFaucetOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Sync admin view if logged in user is admin
  useEffect(() => {
    if (user?.role === "ADMIN") {
      setShowAdminPanel(true);
    }
  }, [user]);

  // Transfer data & receipt data
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [prefilledOtp, setPrefilledOtp] = useState("");

  // Ledger state
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // Copy helpers
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedRout, setCopiedRout] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoadingTx(true);
      const res = await api.accounts.transactions();
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
        <span className="text-sm font-medium">Connecting to Nova Bank Secure Core...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  // If user is Admin and Admin view is active
  if (showAdminPanel && user.role === "ADMIN") {
    return <AdminPanel onBackToUserView={() => setShowAdminPanel(false)} />;
  }

  // Handle external wire initiated -> open OTP modal
  const handleExternalStaged = (stagedData) => {
    setPendingTransfer(stagedData);
    setIsOtpOpen(true);
  };

  // Handle transfer completed -> show receipt & refresh data
  const handleTransferComplete = (receipt) => {
    setReceiptData(receipt);
    setIsReceiptOpen(true);
    refreshAccount();
    fetchTransactions();
  };

  const copyAccountNum = () => {
    navigator.clipboard?.writeText(account?.account_number || "");
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  const copyRoutingNum = () => {
    navigator.clipboard?.writeText(account?.routing_number || "");
    setCopiedRout(true);
    setTimeout(() => setCopiedRout(false), 2000);
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-navy-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-600/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
                NOVA BANK <span className="text-[10px] bg-brand-500/20 text-brand-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Sim</span>
              </span>
              <p className="text-[11px] text-slate-400 hidden sm:block">Powered by Vibe-GX Core</p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin Console Switcher if Admin */}
            {user.role === "ADMIN" && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="relative flex items-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-sm"
                title="Switch to Master Admin Console"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Console</span>
              </button>
            )}

            {/* Virtual Email Inbox Button */}
            <button
              onClick={() => setIsInboxOpen(true)}
              className="relative flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-500/50 text-xs font-semibold text-slate-200 transition shadow-sm"
              title="Open Simulated Email Inbox"
            >
              <Mail className="w-4 h-4 text-brand-400" />
              <span className="hidden sm:inline">Email Inbox</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-white">{user.full_name}</p>
                <p className="text-[10px] text-slate-400">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Top Grid: Balance & Virtual Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Account Overview Card */}
          <div className="lg:col-span-7 bg-navy-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
            {/* Glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-brand-400" /> Total Available Balance
                </span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  FDIC Simulated
                </span>
              </div>

              {/* Big Balance Display */}
              <div className="font-mono text-4xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm">
                ${Number(account?.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-lg sm:text-xl font-sans font-medium text-slate-400 ml-2">USD</span>
              </div>

              {/* Account Numbers Meta Chips */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-navy-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Account Number</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {account?.account_number}
                    </span>
                    <button
                      onClick={copyAccountNum}
                      className="text-slate-500 hover:text-brand-400 transition"
                      title="Copy Account #"
                    >
                      {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-navy-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Routing Number</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {account?.routing_number}
                    </span>
                    <button
                      onClick={copyRoutingNum}
                      className="text-slate-500 hover:text-brand-400 transition"
                      title="Copy Routing #"
                    >
                      {copiedRout ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button
                onClick={() => setIsTransferOpen(true)}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/25 transition active:scale-[0.98]"
              >
                <ArrowUpRight className="w-4 h-4" /> Send Money
              </button>

              <button
                onClick={() => setIsFaucetOpen(true)}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" /> Top Up / Faucet
              </button>
            </div>
          </div>

          {/* Right Column: Virtual Platinum Debit Card */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <DebitCard account={account} onUpdate={refreshAccount} />
          </div>
        </div>

        {/* Bottom Section: Activity Ledger */}
        <TransactionList
          transactions={transactions}
          loading={loadingTx}
          onSelectTransaction={(tx) => {
            setReceiptData(tx);
            setIsReceiptOpen(true);
          }}
        />
      </main>

      {/* Modal Dialogs */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        currentBalance={account?.balance || 0}
        onInternalSuccess={handleTransferComplete}
        onExternalStaged={handleExternalStaged}
      />

      <OtpVerificationModal
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        transferData={pendingTransfer}
        onSuccess={handleTransferComplete}
        onOpenPhone={() => setIsInboxOpen(true)}
        prefilledOtp={prefilledOtp}
      />

      <TransactionReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        data={receiptData}
      />

      <FaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
        onSuccess={() => {
          refreshAccount();
          fetchTransactions();
        }}
      />

      {/* Simulated Email Inbox Drawer */}
      <VirtualInboxDrawer
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        onSelectOtp={(code) => setPrefilledOtp(code)}
        userEmail={user?.email}
      />
    </div>
  );
}
