import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import AuthView from "./components/AuthView";
import DebitCard from "./components/DebitCard";
import TransferModal from "./components/TransferModal";
import OtpVerificationModal from "./components/OtpVerificationModal";
import TransactionReceiptModal from "./components/TransactionReceiptModal";
import VirtualInboxDrawer from "./components/VirtualInboxDrawer";
import TransactionList from "./components/TransactionList";
import AdminPanel from "./components/AdminPanel";
import EmailVerificationBanner from "./components/EmailVerificationBanner";
import FirstHorizonLanding, { FirstHorizonLogo } from "./components/FirstHorizonLanding";
import { api } from "./services/api";
import {
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  Mail,
  LogOut,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  Wallet,
} from "lucide-react";

export default function App() {
  const { user, account, loading: authLoading, logout, refreshAccount, setAccount } = useAuth();

  // Modals state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  // View toggle for unauthenticated visitors: null (show Landing Page), "login", or "register"
  const [authModalMode, setAuthModalMode] = useState(null);

  // Sync admin view: only automatically open for Master Admin account
  useEffect(() => {
    if (user?.email === "admin@novabank.com" && user?.role === "ADMIN") {
      setShowAdminPanel(true);
    }
  }, [user]);

  // Transfer data & receipt data
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [prefilledOtp, setPrefilledOtp] = useState("");

  // Live sync alerts and visual pulse
  const [liveAlert, setLiveAlert] = useState(null); // { type: 'credit' | 'debit' | 'card', message: string }
  const [balanceFlash, setBalanceFlash] = useState(null); // null | 'credit' | 'debit'

  // Ref tracking latest account to prevent interval teardowns
  const accountRef = useRef(account);
  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  // Ledger state
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // Copy helpers
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedRout, setCopiedRout] = useState(false);

  const fetchTransactions = async (silent = false) => {
    try {
      if (!silent) setLoadingTx(true);
      const res = await api.accounts.transactions();
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      if (!silent) setLoadingTx(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  // Live Core Polling: Automatically pulls live balance, card status, and transactions
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    let isFetching = false;

    const pollAccountState = async (isBackground = true) => {
      // If page is hidden and this is an automatic background tick, skip to save CPU & network
      if (document.hidden && isBackground) return;
      if (isFetching) return;
      isFetching = true;

      try {
        const res = await api.auth.me();
        if (!isMounted) return;

        if (res?.account) {
          const prevAccount = accountRef.current;
          const prevBal = prevAccount?.balance;
          const newBal = res.account.balance;

          // Detect balance changes
          if (
            typeof prevBal === "number" &&
            typeof newBal === "number" &&
            Math.abs(newBal - prevBal) > 0.001
          ) {
            const diff = newBal - prevBal;
            const formattedDiff = Math.abs(diff).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

            if (diff > 0) {
              setLiveAlert({
                type: "credit",
                message: `Incoming transfer received: +$${formattedDiff}`,
              });
              setBalanceFlash("credit");
            } else {
              setLiveAlert({
                type: "debit",
                message: `Account debited: -$${formattedDiff}`,
              });
              setBalanceFlash("debit");
            }

            setTimeout(() => {
              if (isMounted) setBalanceFlash(null);
            }, 2500);

            setTimeout(() => {
              if (isMounted) setLiveAlert(null);
            }, 5500);

            // Re-fetch ledger immediately when balance updates
            fetchTransactions(true);
          }

          // Detect card approval (PENDING -> ACTIVE)
          if (
            prevAccount &&
            prevAccount.card_status === "PENDING" &&
            res.account.card_status === "ACTIVE"
          ) {
            setLiveAlert({
              type: "card",
              message: "Your First Horizon Platinum Visa Card has been approved!",
            });
            setTimeout(() => {
              if (isMounted) setLiveAlert(null);
            }, 6000);
          }

          // Update current account in context
          setAccount(res.account);
        }
      } catch (err) {
        // Ignored in background polling
      } finally {
        isFetching = false;
      }
    };

    // 1. Polling interval: Every 3.5 seconds
    const intervalId = setInterval(() => {
      pollAccountState(true);
    }, 3500);

    // 2. Immediate poll on window focus or tab visibility change
    const handleActive = () => {
      if (!document.hidden) {
        pollAccountState(false);
        fetchTransactions(true);
      }
    };

    window.addEventListener("focus", handleActive);
    document.addEventListener("visibilitychange", handleActive);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener("focus", handleActive);
      document.removeEventListener("visibilitychange", handleActive);
    };
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#001F5F] flex flex-col items-center justify-center text-white gap-4">
        <FirstHorizonLogo variant="light" className="h-10 animate-pulse" />
        <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
          <span>Connecting to First Horizon Secure Core...</span>
        </div>
      </div>
    );
  }

  // When unauthenticated, show the First Horizon Landing Page, or switch to AuthView if requested
  if (!user) {
    if (!authModalMode) {
      return (
        <FirstHorizonLanding
          onOpenAuth={() => setAuthModalMode("login")}
          onOpenRegister={() => setAuthModalMode("register")}
        />
      );
    }
    return (
      <AuthView
        initialMode={authModalMode}
        onBackToLanding={() => setAuthModalMode(null)}
      />
    );
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
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col">
      {/* Top Navigation Bar: First Horizon Navy */}
      <header className="sticky top-0 z-40 bg-[#001F5F] text-white border-b border-[#001438] shadow-md px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <FirstHorizonLogo variant="light" className="h-8 sm:h-9" />
            <span className="text-[10px] bg-red-500/25 text-red-200 border border-red-500/40 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
              Digital Banking Portal
            </span>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin Console Switcher if Admin */}
            {user.role === "ADMIN" && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="relative flex items-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition shadow-sm"
                title="Switch to Master Admin Console"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Admin Console</span>
              </button>
            )}

            {/* Virtual Email Inbox Button */}
            <button
              onClick={() => setIsInboxOpen(true)}
              className="relative flex items-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition shadow-sm"
              title="Open Email Inbox"
            >
              <Mail className="w-4 h-4 text-sky-300" />
              <span className="hidden sm:inline">Email Inbox</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/20">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-white leading-tight">{user.full_name}</p>
                <p className="text-[10px] text-slate-300">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/15 transition"
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
        {/* Email verification warning banner (hidden once verified) */}
        <EmailVerificationBanner onOpenInbox={() => setIsInboxOpen(true)} />

        {/* Top Grid: Balance & Virtual Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Account Overview Card */}
          <div className="lg:col-span-7 bg-gradient-to-br from-[#001F5F] via-[#003380] to-[#004DA7] text-white border border-[#002d80] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle Horizon Glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#E2231A]/15 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-sky-300" /> Total Available Balance
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-emerald-300 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full">
                    Member FDIC
                  </span>
                </div>
              </div>

              {/* Big Balance Display with dynamic pulse styling on live credit/debit */}
              <div
                className={`font-mono text-4xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm transition-all duration-300 ${
                  balanceFlash === "credit"
                    ? "scale-105 text-emerald-300"
                    : balanceFlash === "debit"
                    ? "scale-95 text-amber-300"
                    : ""
                }`}
              >
                ${Number(account?.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-lg sm:text-xl font-sans font-medium text-slate-300 ml-2">USD</span>
              </div>

              {/* Account Numbers Meta Chips */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-black/25 backdrop-blur-sm p-3 rounded-2xl border border-white/15">
                  <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Account Number</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-xs font-semibold text-white">
                      {account?.account_number}
                    </span>
                    <button
                      onClick={copyAccountNum}
                      className="text-slate-300 hover:text-white transition"
                      title="Copy Account #"
                    >
                      {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-black/25 backdrop-blur-sm p-3 rounded-2xl border border-white/15">
                  <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Routing Number</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-xs font-semibold text-white">
                      {account?.routing_number}
                    </span>
                    <button
                      onClick={copyRoutingNum}
                      className="text-slate-300 hover:text-white transition"
                      title="Copy Routing #"
                    >
                      {copiedRout ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action: Transfer & Send Money */}
            <div className="mt-8">
              <button
                onClick={() => setIsTransferOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#E2231A] hover:bg-[#c81e16] text-white font-bold text-sm shadow-lg shadow-[#E2231A]/30 transition active:scale-[0.98]"
              >
                <ArrowUpRight className="w-4 h-4" /> Transfer &amp; Send Money
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

        {/* First Horizon Institutional Footer */}
        <footer className="pt-8 pb-4 border-t border-slate-200 text-center text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-center gap-4 flex-wrap text-slate-600 font-semibold text-[11px]">
            <span>Member FDIC</span>
            <span>•</span>
            <span>Equal Housing Lender</span>
            <span>•</span>
            <span>Official Bank of the Tennessee Titans</span>
            <span>•</span>
            <span>Privacy &amp; Security</span>
          </div>
          <p className="text-[11px] text-slate-400">
            © 2026 First Horizon Bank. All rights reserved. Banking products and services provided by First Horizon Bank.
          </p>
        </footer>

        {/* Floating Live Alert Toast */}
        {liveAlert && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <div
              className={`flex items-center gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md text-sm font-bold ${
                liveAlert.type === "credit"
                  ? "bg-emerald-950/95 border-emerald-500 text-emerald-100 shadow-emerald-900/40"
                  : liveAlert.type === "card"
                  ? "bg-[#001F5F]/95 border-sky-400 text-sky-100 shadow-blue-900/40"
                  : "bg-slate-900/95 border-amber-500 text-amber-100 shadow-slate-900/40"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  liveAlert.type === "credit"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : liveAlert.type === "card"
                    ? "bg-sky-500/20 text-sky-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {liveAlert.type === "credit" ? (
                  <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                ) : liveAlert.type === "card" ? (
                  <ShieldCheck className="w-5 h-5 text-sky-300" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">
                  {liveAlert.type === "credit"
                    ? "Incoming Transaction"
                    : liveAlert.type === "card"
                    ? "Card Issuance"
                    : "Account Activity"}
                </p>
                <p className="text-xs font-extrabold">{liveAlert.message}</p>
              </div>
            </div>
          </div>
        )}
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

      {/* Secure Email Inbox Drawer */}
      <VirtualInboxDrawer
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        onSelectOtp={(code) => setPrefilledOtp(code)}
        userEmail={user?.email}
      />
    </div>
  );
}
