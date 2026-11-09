import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import AdjustBalanceModal from "./AdjustBalanceModal";
import { FirstHorizonLogo } from "./FirstHorizonLanding";
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  DollarSign,
  Activity,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  ArrowUpRight,
  Send,
  Building,
  Check,
  X,
  RotateCcw,
  Zap,
  CreditCard,
  UserCheck,
  UserX,
} from "lucide-react";

export default function AdminPanel({ onBackToUserView }) {
  const { user: currentAdmin } = useAuth();
  const isSuperAdmin = currentAdmin?.admin_role === "SUPER_ADMIN" || currentAdmin?.email === "admin@novabank.com";

  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("customers"); // "customers" | "ledger" | "security"
  const [customerFilter, setCustomerFilter] = useState("ALL"); // "ALL" | "PENDING_CARD" | "FROZEN" | "UNVERIFIED" | "ADMINS"
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Customers Tab State
  const [customers, setCustomers] = useState([]);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [selectedCustomerForAdjustment, setSelectedCustomerForAdjustment] = useState(null);

  // Transactions Tab State
  const [transactions, setTransactions] = useState([]);
  const [txSearch, setTxSearch] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("");

  // Security / OTP Tab State
  const [otpTokens, setOtpTokens] = useState([]);

  // Reset password modal state
  const [resetPassUser, setResetPassUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // Fetch telemetry
  const loadStats = async (silent = false) => {
    try {
      const res = await api.admin.stats();
      setStats(res.stats || null);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    }
  };

  // Fetch customers
  const loadCustomers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.admin.users({ search: searchCustomer });
      setCustomers(res.users || []);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch transactions
  const loadTransactions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.admin.transactions({
        search: txSearch,
        status: txStatusFilter,
        type: txTypeFilter,
      });
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch OTP tokens
  const loadOtpTokens = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.admin.otpTokens();
      setOtpTokens(res.tokens || []);
    } catch (err) {
      console.error("Failed to load OTP tokens:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === "customers") loadCustomers();
    else if (activeTab === "ledger") loadTransactions();
    else if (activeTab === "security") loadOtpTokens();
  }, [activeTab, searchCustomer, txStatusFilter, txTypeFilter, txSearch]);

  // Live Core Polling: Keeps customer directory, pending cards, and telemetry updated in real time
  useEffect(() => {
    const pollAdminData = () => {
      if (document.hidden) return;
      loadStats(true);
      if (activeTab === "customers") loadCustomers(true);
      else if (activeTab === "ledger") loadTransactions(true);
      else if (activeTab === "security") loadOtpTokens(true);
    };

    const intervalId = setInterval(pollAdminData, 4000);

    const handleFocus = () => {
      if (!document.hidden) pollAdminData();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [activeTab, searchCustomer, txStatusFilter, txTypeFilter, txSearch]);

  const showFeedback = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3500);
  };

  // Freeze / Unfreeze
  const handleToggleFreeze = async (user) => {
    try {
      const res = await api.admin.toggleFreeze(user.id);
      showFeedback(res.message || "Account status updated");
      loadCustomers();
      loadStats();
    } catch (err) {
      alert(err.message || "Failed to toggle freeze");
    }
  };

  // Approve Visa Debit Card
  const handleApproveCard = async (user) => {
    try {
      const res = await api.admin.approveCard(user.id);
      showFeedback(res.message || `Visa Debit Card approved and issued for ${user.full_name}`);
      loadCustomers();
      loadStats();
    } catch (err) {
      alert(err.message || "Failed to approve card application");
    }
  };

  // Decline Visa Debit Card Application
  const handleRejectCard = async (user) => {
    if (!window.confirm(`Decline Visa card application for customer ${user.full_name}?`)) {
      return;
    }
    try {
      const res = await api.admin.rejectCard(user.id);
      showFeedback(res.message || `Card application declined for ${user.full_name}`);
      loadCustomers();
      loadStats();
    } catch (err) {
      alert(err.message || "Failed to decline card application");
    }
  };

  // Admin Manual Email Verification / Reactivation
  const handleAdminVerifyEmail = async (user) => {
    try {
      const res = await api.admin.verifyEmail(user.id);
      showFeedback(res.message || "Customer email verified & activated");
      loadCustomers();
      loadStats();
    } catch (err) {
      alert(err.message || "Failed to verify email");
    }
  };

  // Admin Toggle Dormant Status
  const handleAdminToggleDormant = async (user) => {
    try {
      const res = await api.admin.toggleDormant(user.id);
      showFeedback(res.message || "Dormancy status changed");
      loadCustomers();
      loadStats();
    } catch (err) {
      alert(err.message || "Failed to toggle dormancy");
    }
  };

  // Delete User
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete customer ${user.full_name}?`)) {
      return;
    }
    try {
      await api.admin.deleteUser(user.id);
      showFeedback("Customer account permanently deleted");
      loadCustomers();
      loadStats();
    } catch (err) {
      alert(err.message || "Failed to delete user");
    }
  };

  // Promote / Demote Limited Staff Administrator (Master Admin only)
  const handleToggleAdminRole = async (customer) => {
    const isCurrentlyAdmin = customer.role === "ADMIN";
    const newRole = isCurrentlyAdmin ? "CUSTOMER" : "ADMIN";
    const newAdminRole = isCurrentlyAdmin ? null : "LIMITED_ADMIN";

    const confirmMsg = isCurrentlyAdmin
      ? `Revoke administrator access for ${customer.full_name}?\n\nThey will be reverted to standard customer privileges.`
      : `Grant Limited Administrator privileges to ${customer.full_name}?\n\nLimited admins can review debit card applications, freeze accounts, assist with email verification, and view ledgers, but CANNOT adjust bank balances, delete customers, or reverse transactions.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.admin.setRole(customer.id, { role: newRole, admin_role: newAdminRole });
      showFeedback(res.message || "User role updated successfully");
      loadCustomers();
      loadStats();
    } catch (err) {
      alert(err.message || "Failed to update user role");
    }
  };

  // Reset Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPassUser || !newPassword) return;
    try {
      await api.admin.resetPassword(resetPassUser.id, newPassword);
      showFeedback(`Password for ${resetPassUser.full_name} updated successfully`);
      setResetPassUser(null);
      setNewPassword("");
    } catch (err) {
      alert(err.message || "Failed to reset password");
    }
  };

  // Wire Action (Force Approve, Cancel, Reverse)
  const handleTransactionAction = async (txId, action) => {
    try {
      const res = await api.admin.transactionAction(txId, action);
      showFeedback(res.message || `Transaction ${action} executed`);
      loadTransactions();
      loadStats();
    } catch (err) {
      alert(err.message || "Action failed");
    }
  };

  // Force verify OTP
  const handleForceVerifyOtp = async (tokenId) => {
    try {
      await api.admin.forceVerifyOtp(tokenId);
      showFeedback("OTP token verified manually");
      loadOtpTokens();
    } catch (err) {
      alert(err.message || "Failed to verify OTP");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-[#001F5F] text-white border-b border-[#001438] shadow-md px-3 sm:px-8 py-3 sm:py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <FirstHorizonLogo variant="light" className="h-7 sm:h-9 flex-shrink-0" />
            <div className="border-l border-white/20 pl-2 sm:pl-3 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-extrabold text-xs sm:text-base text-white tracking-tight whitespace-nowrap">
                  TREASURY &amp; ADMIN CORE
                </span>
                {isSuperAdmin ? (
                  <span className="text-[9px] sm:text-[10px] bg-[#E2231A] text-white font-bold px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap flex-shrink-0">
                    Master Administrator
                  </span>
                ) : (
                  <span className="text-[9px] sm:text-[10px] bg-amber-400 text-slate-900 font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap flex-shrink-0 inline-flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Limited Staff Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 hidden md:block truncate">
                {isSuperAdmin
                  ? "Liquidity Management, Ledger Settlement, and Role Authorization"
                  : "Customer Servicing, Debit Card Underwriting, and Account Controls"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {message && (
              <span className="hidden xl:inline-block text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl animate-fadeIn whitespace-nowrap">
                {message}
              </span>
            )}
            <button
              onClick={() => {
                loadStats();
                if (activeTab === "customers") loadCustomers();
                else if (activeTab === "ledger") loadTransactions();
                else loadOtpTokens();
              }}
              title="Refresh Data"
              className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            {onBackToUserView && (
              <button
                onClick={onBackToUserView}
                className="flex items-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition shadow-sm whitespace-nowrap flex-shrink-0"
              >
                Exit to User View
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Limited Admin Notice Banner */}
        {!isSuperAdmin && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-950 shadow-sm animate-fadeIn">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-[#001F5F] block text-sm">
                  Limited Staff Administrator Session
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed mt-0.5">
                  You have operational permissions for customer servicing: debit card reviews &amp; approvals, account freezing, manual email verification, and core ledger auditing. Vault balance adjustments, transaction reversals, and customer deletions are restricted to Master Administrators.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Telemetry Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Vault Liquidity</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-lg sm:text-xl font-extrabold text-[#001F5F] truncate">
              ${Number(stats?.vault_liquidity || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Customer Deposits</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Customers</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#004DA7] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-lg sm:text-xl font-extrabold text-[#001F5F]">
              {stats?.total_customers || 0}
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">Active Profiles</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Settled Volume</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-[#001F5F] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-lg sm:text-xl font-extrabold text-[#001F5F] truncate">
              ${Number(stats?.total_volume || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">{stats?.total_transactions || 0} Total Transfers</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending Wires</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className={`font-mono text-lg sm:text-xl font-extrabold ${stats?.pending_wires > 0 ? "text-[#E2231A]" : "text-[#001F5F]"}`}>
              {stats?.pending_wires || 0}
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">2FA Wires Pending</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Card Queue</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#004DA7] flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className={`font-mono text-lg sm:text-xl font-extrabold ${(stats?.pending_cards || 0) > 0 ? "text-[#004DA7]" : "text-[#001F5F]"}`}>
              {stats?.pending_cards || 0}
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">Cards Awaiting Review</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Frozen / Dormant</span>
              <div className="w-7 h-7 rounded-lg bg-red-50 text-[#E2231A] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div className={`font-mono text-lg sm:text-xl font-extrabold ${stats?.frozen_accounts > 0 ? "text-[#E2231A]" : "text-[#001F5F]"}`}>
              {stats?.frozen_accounts || 0}
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">Restricted Profiles</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("customers")}
            className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === "customers"
                ? "bg-[#001F5F] text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-700 hover:text-[#001F5F] hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4" /> Customers &amp; Vault ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === "ledger"
                ? "bg-[#001F5F] text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-700 hover:text-[#001F5F] hover:bg-slate-50"
            }`}
          >
            <Activity className="w-4 h-4" /> Global Core Ledger
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === "security"
                ? "bg-[#001F5F] text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-700 hover:text-[#001F5F] hover:bg-slate-50"
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Live Passcode &amp; Security Monitor
          </button>
        </div>

        {/* TAB 1: CUSTOMERS DIRECTORY */}
        {activeTab === "customers" && (() => {
          const filteredCustomers = customers.filter((c) => {
            if (customerFilter === "PENDING_CARD") return c.card_status === "PENDING";
            if (customerFilter === "FROZEN") return c.is_frozen === 1 || c.is_dormant === 1;
            if (customerFilter === "UNVERIFIED") return c.email_verified !== 1;
            if (customerFilter === "ADMINS") return c.role === "ADMIN";
            return true;
          });

          return (
            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
              {/* Search Filter & Filter Pills */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={searchCustomer}
                      onChange={(e) => setSearchCustomer(e.target.value)}
                      placeholder="Search name, email, account#..."
                      className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white outline-none transition"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-semibold whitespace-nowrap self-end sm:self-center">
                    Showing {filteredCustomers.length} of {customers.length} records
                  </span>
                </div>

                {/* Filter Pills with smooth horizontal scrolling */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar flex-nowrap sm:flex-wrap">
                  <button
                    onClick={() => setCustomerFilter("ALL")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex-shrink-0 ${
                      customerFilter === "ALL"
                        ? "bg-[#001F5F] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All ({customers.length})
                  </button>
                  <button
                    onClick={() => setCustomerFilter("PENDING_CARD")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
                      customerFilter === "PENDING_CARD"
                        ? "bg-amber-600 text-white"
                        : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Pending Cards ({customers.filter((c) => c.card_status === "PENDING").length})
                  </button>
                  <button
                    onClick={() => setCustomerFilter("ADMINS")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
                      customerFilter === "ADMINS"
                        ? "bg-indigo-700 text-white"
                        : "bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Admins &amp; Staff ({customers.filter((c) => c.role === "ADMIN").length})
                  </button>
                  <button
                    onClick={() => setCustomerFilter("UNVERIFIED")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex-shrink-0 ${
                      customerFilter === "UNVERIFIED"
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-[#004DA7] border border-blue-200 hover:bg-blue-100"
                    }`}
                  >
                    Unverified ({customers.filter((c) => c.email_verified !== 1).length})
                  </button>
                  <button
                    onClick={() => setCustomerFilter("FROZEN")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex-shrink-0 ${
                      customerFilter === "FROZEN"
                        ? "bg-red-600 text-white"
                        : "bg-red-50 text-[#E2231A] border border-red-200 hover:bg-red-100"
                    }`}
                  >
                    Frozen ({customers.filter((c) => c.is_frozen === 1 || c.is_dormant === 1).length})
                  </button>
                </div>
              </div>

              {/* Desktop & Tablet Table View (md+ screens) */}
              <div className="hidden md:block rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 min-w-[1100px]">
                    <thead className="bg-slate-100 text-[#001F5F] uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4 w-[230px] min-w-[210px] whitespace-nowrap">Customer Name &amp; Email</th>
                        <th className="py-3.5 px-4 w-[150px] min-w-[140px] whitespace-nowrap">Account Number</th>
                        <th className="py-3.5 px-4 w-[160px] min-w-[150px] whitespace-nowrap">Available Balance</th>
                        <th className="py-3.5 px-4 w-[190px] min-w-[180px] whitespace-nowrap">Card &amp; Status</th>
                        <th className="py-3.5 px-4 min-w-[370px] text-right whitespace-nowrap">Administrative Actions</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No customers matching search or filter criteria
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition">
                          {/* Name & Email */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-[#001F5F] block text-sm">{c.full_name}</span>
                            <span className="text-slate-500 font-mono text-[11px]">{c.email}</span>
                            {c.role === "ADMIN" && (
                              <span
                                className={`inline-block mt-1 border text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  c.admin_role === "SUPER_ADMIN" || c.email === "admin@novabank.com"
                                    ? "bg-red-100 text-[#E2231A] border-red-200"
                                    : "bg-amber-100 text-amber-900 border-amber-300"
                                }`}
                              >
                                {c.admin_role === "SUPER_ADMIN" || c.email === "admin@novabank.com"
                                  ? "MASTER ADMIN"
                                  : "STAFF ADMIN (Limited)"}
                              </span>
                            )}
                          </td>

                          {/* Account Number */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-800 block">{c.account_number}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Routing: {c.routing_number}</span>
                          </td>

                          {/* Balance */}
                          <td className="py-3 px-4">
                            <span className="font-mono text-base font-extrabold text-[#001F5F] block">
                              ${Number(c.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{c.transaction_count || 0} Transactions</span>
                          </td>

                          {/* Status & Card */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {c.is_dormant === 1 ? (
                                  <span className="inline-flex items-center gap-1 bg-red-100 border border-red-300 text-[#E2231A] px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    <Lock className="w-3 h-3" /> Dormant (14d+)
                                  </span>
                                ) : c.is_frozen === 1 ? (
                                  <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    <Lock className="w-3 h-3" /> Account Frozen
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3" /> Active
                                  </span>
                                )}

                                {c.email_verified === 1 ? (
                                  <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-[#004DA7] px-1.5 py-0.5 rounded text-[9px] font-bold">
                                    Verified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                    Unverified
                                  </span>
                                )}
                              </div>

                              {/* Card Status & Number */}
                              <div className="mt-1">
                                {c.card_status === "PENDING" ? (
                                  <span className="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-900 px-2 py-0.5 rounded-md text-[10px] font-bold animate-pulse">
                                    <CreditCard className="w-3 h-3 text-amber-700" /> Card Awaiting Approval
                                  </span>
                                ) : c.card_status === "ACTIVE" ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                      <CreditCard className="w-3 h-3 text-emerald-600" /> Active Visa
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      •••• {c.card_number ? c.card_number.slice(-4) : "••••"}
                                    </span>
                                  </div>
                                ) : c.card_status === "REJECTED" ? (
                                  <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                                    Card Declined
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-sans italic">
                                    No Card Issued
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                              {/* Card Approval / Reject Buttons when PENDING */}
                              {c.card_status === "PENDING" && (
                                <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-300 rounded-xl p-1 shadow-sm flex-shrink-0">
                                  <button
                                    onClick={() => handleApproveCard(c)}
                                    className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition whitespace-nowrap flex-shrink-0"
                                    title="Approve & issue Visa Debit Card"
                                  >
                                    <Check className="w-3 h-3" /> Approve Card
                                  </button>
                                  <button
                                    onClick={() => handleRejectCard(c)}
                                    className="inline-flex items-center gap-1 py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-sm transition whitespace-nowrap flex-shrink-0"
                                    title="Decline Card Application"
                                  >
                                    <X className="w-3 h-3" /> Decline
                                  </button>
                                </div>
                              )}

                              {/* Verify / Reactivate Email Shortcut */}
                              {c.email_verified !== 1 && (
                                <button
                                  onClick={() => handleAdminVerifyEmail(c)}
                                  className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-xl bg-[#004DA7] hover:bg-[#003882] text-white font-bold text-[11px] shadow-sm transition whitespace-nowrap flex-shrink-0"
                                  title="Manually verify email and clear dormancy"
                                >
                                  <Check className="w-3.5 h-3.5" /> Verify Email
                                </button>
                              )}

                              {/* Master Admin can Promote or Demote to Limited Admin */}
                              {isSuperAdmin && c.email !== "admin@novabank.com" && (
                                <button
                                  onClick={() => handleToggleAdminRole(c)}
                                  className={`inline-flex items-center gap-1 py-1.5 px-2.5 rounded-xl font-bold text-[11px] shadow-sm transition border whitespace-nowrap flex-shrink-0 ${
                                    c.role === "ADMIN"
                                      ? "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100"
                                      : "bg-indigo-50 border-indigo-200 text-[#004DA7] hover:bg-indigo-100"
                                  }`}
                                  title={c.role === "ADMIN" ? "Revoke administrator privileges" : "Grant Limited Staff Administrator access"}
                                >
                                  {c.role === "ADMIN" ? (
                                    <>
                                      <UserX className="w-3.5 h-3.5 text-rose-600" /> Revoke Admin
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5 text-[#004DA7]" /> Make Admin
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Adjust Balance Button (Super Admin only) */}
                              {isSuperAdmin ? (
                                <button
                                  onClick={() => setSelectedCustomerForAdjustment(c)}
                                  className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition whitespace-nowrap flex-shrink-0"
                                  title="Add or modify balance"
                                >
                                  <DollarSign className="w-3.5 h-3.5" /> Adjust Balance
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="inline-flex items-center gap-1 py-1.5 px-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-[10px] border border-slate-200 cursor-not-allowed opacity-60 whitespace-nowrap flex-shrink-0"
                                  title="Restricted: Master Administrator privileges required to adjust vault balance"
                                >
                                  <Lock className="w-3 h-3" /> Adjust Balance
                                </button>
                              )}

                              {/* Compact Icon Tools Toolbar */}
                              <div className="inline-flex items-center gap-0.5 bg-slate-50 border border-slate-200 rounded-xl p-0.5 flex-shrink-0">
                                {/* Freeze/Unfreeze Toggle */}
                                <button
                                  onClick={() => handleToggleFreeze(c)}
                                  disabled={!isSuperAdmin && c.role === "ADMIN"}
                                  className={`p-1.5 rounded-lg border transition ${
                                    !isSuperAdmin && c.role === "ADMIN"
                                      ? "bg-slate-50 border-transparent text-slate-300 cursor-not-allowed opacity-60"
                                      : c.is_frozen === 1
                                      ? "bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
                                      : "bg-white border-slate-200 text-slate-600 hover:text-[#E2231A]"
                                  }`}
                                  title={
                                    !isSuperAdmin && c.role === "ADMIN"
                                      ? "Limited admins cannot freeze other administrator accounts"
                                      : c.is_frozen === 1
                                      ? "Unfreeze Account"
                                      : "Freeze Account"
                                  }
                                >
                                  {c.is_frozen === 1 ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                </button>

                                {/* Reset Password */}
                                <button
                                  onClick={() => setResetPassUser(c)}
                                  disabled={!isSuperAdmin && c.role === "ADMIN"}
                                  className={`p-1.5 rounded-lg border transition ${
                                    !isSuperAdmin && c.role === "ADMIN"
                                      ? "bg-slate-50 border-transparent text-slate-300 cursor-not-allowed opacity-60"
                                      : "bg-white border-slate-200 text-slate-600 hover:text-[#001F5F] hover:border-slate-300"
                                  }`}
                                  title={
                                    !isSuperAdmin && c.role === "ADMIN"
                                      ? "Limited admins cannot reset passwords for other administrators"
                                      : "Reset Password"
                                  }
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete User (Master Admin only) */}
                                {isSuperAdmin && c.email !== "admin@novabank.com" && (
                                  <button
                                    onClick={() => handleDeleteUser(c)}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-[#E2231A] hover:bg-red-50 transition"
                                    title="Delete Customer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-4 py-2.5 bg-slate-50/80 border-t border-slate-200 font-medium">
                <span>Showing {filteredCustomers.length} records</span>
                <span className="hidden sm:inline">Use Shift + Scroll or swipe horizontally to view all administrative actions</span>
              </div>
            </div>

            {/* Mobile Card List View (visible on < md screens) */}
            <div className="block md:hidden space-y-3.5">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  No customers matching search or filter criteria
                </div>
              ) : (
                filteredCustomers.map((c) => (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                    {/* Customer Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#001F5F] text-sm leading-tight">{c.full_name}</span>
                          {c.role === "ADMIN" && (
                            <span
                              className={`border text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                                c.admin_role === "SUPER_ADMIN" || c.email === "admin@novabank.com"
                                  ? "bg-red-100 text-[#E2231A] border-red-200"
                                  : "bg-amber-100 text-amber-900 border-amber-300"
                              }`}
                            >
                              {c.admin_role === "SUPER_ADMIN" || c.email === "admin@novabank.com"
                                ? "MASTER ADMIN"
                                : "STAFF ADMIN"}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 font-mono text-xs block truncate mt-0.5">{c.email}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-mono text-base font-extrabold text-[#001F5F] block">
                          ${Number(c.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400">{c.transaction_count || 0} Tx</span>
                      </div>
                    </div>

                    {/* Account Details & Status Badges */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70 text-xs space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600">Acc: <strong className="font-mono text-slate-900">{c.account_number}</strong></span>
                        <span className="text-slate-500 font-mono">Routing: {c.routing_number}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-200/60">
                        {c.is_dormant === 1 ? (
                          <span className="inline-flex items-center gap-1 bg-red-100 border border-red-300 text-[#E2231A] px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <Lock className="w-3 h-3" /> Dormant (14d+)
                          </span>
                        ) : c.is_frozen === 1 ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <Lock className="w-3 h-3" /> Frozen
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}

                        {c.email_verified === 1 ? (
                          <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-[#004DA7] px-1.5 py-0.5 rounded text-[9px] font-bold">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            Unverified
                          </span>
                        )}

                        {c.card_status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                            <CreditCard className="w-3 h-3 text-amber-700" /> Card Pending
                          </span>
                        ) : c.card_status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            <CreditCard className="w-3 h-3 text-emerald-600" /> Visa •••• {c.card_number ? c.card_number.slice(-4) : "••••"}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="space-y-2 pt-1">
                      {c.card_status === "PENDING" && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleApproveCard(c)}
                            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Card
                          </button>
                          <button
                            onClick={() => handleRejectCard(c)}
                            className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {c.email_verified !== 1 && (
                          <button
                            onClick={() => handleAdminVerifyEmail(c)}
                            className="flex-1 min-w-[130px] py-2 px-3 rounded-xl bg-[#004DA7] hover:bg-[#003882] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" /> Verify Email
                          </button>
                        )}

                        {isSuperAdmin && c.email !== "admin@novabank.com" && (
                          <button
                            onClick={() => handleToggleAdminRole(c)}
                            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 shadow-sm ${
                              c.role === "ADMIN"
                                ? "bg-rose-50 border-rose-300 text-rose-700"
                                : "bg-indigo-50 border-indigo-200 text-[#004DA7]"
                            }`}
                          >
                            {c.role === "ADMIN" ? (
                              <><UserX className="w-3.5 h-3.5 text-rose-600" /> Revoke Admin</>
                            ) : (
                              <><UserCheck className="w-3.5 h-3.5 text-[#004DA7]" /> Make Admin</>
                            )}
                          </button>
                        )}

                        {isSuperAdmin && (
                          <button
                            onClick={() => setSelectedCustomerForAdjustment(c)}
                            className="flex-1 min-w-[130px] py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Adjust Balance
                          </button>
                        )}
                      </div>

                      {/* Mobile Icon Action Row */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleToggleFreeze(c)}
                          disabled={!isSuperAdmin && c.role === "ADMIN"}
                          className={`flex items-center gap-1 text-xs py-1.5 px-3 rounded-xl border font-medium ${
                            c.is_frozen === 1
                              ? "bg-amber-50 border-amber-300 text-amber-800"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          {c.is_frozen === 1 ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          {c.is_frozen === 1 ? "Unfreeze" : "Freeze"}
                        </button>

                        <button
                          onClick={() => setResetPassUser(c)}
                          disabled={!isSuperAdmin && c.role === "ADMIN"}
                          className="flex items-center gap-1 text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
                        >
                          <KeyRound className="w-3.5 h-3.5" /> Password
                        </button>

                        {isSuperAdmin && c.email !== "admin@novabank.com" && (
                          <button
                            onClick={() => handleDeleteUser(c)}
                            className="flex items-center gap-1 text-xs py-1.5 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            </div>
          );
        })()}

        {/* TAB 2: MASTER LEDGER */}
        {activeTab === "ledger" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Filter ref#, memo, name..."
                  className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white outline-none transition"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                  className="text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 focus:border-[#004DA7] outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING_OTP">Pending OTP</option>
                  <option value="FAILED">Failed</option>
                  <option value="REVERSED">Reversed</option>
                </select>

                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value)}
                  className="text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 focus:border-[#004DA7] outline-none"
                >
                  <option value="">All Types</option>
                  <option value="INTERNAL">Internal</option>
                  <option value="EXTERNAL">External Wire</option>
                  <option value="FAUCET">Faucet</option>
                  <option value="ADMIN_ADJUSTMENT">Admin Adjustment</option>
                </select>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700 min-w-[960px]">
                <thead className="bg-slate-100 text-[#001F5F] uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">Ref ID &amp; Time</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Type</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Parties</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Amount</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#001F5F] block">{tx.reference_id}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(tx.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {tx.type}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5 truncate max-w-[120px]">{tx.description}</span>
                        </td>

                        <td className="py-3 px-4">
                          {tx.sender_name && (
                            <span className="text-slate-600 block">From: <strong className="text-slate-900">{tx.sender_name}</strong></span>
                          )}
                          {tx.recipient_name && (
                            <span className="text-slate-600 block">To: <strong className="text-slate-900">{tx.recipient_name}</strong></span>
                          )}
                          {tx.external_bank_details && (
                            <span className="text-slate-500 text-[11px] block">
                              Wire: {tx.external_bank_details.beneficiary_name} ({tx.external_bank_details.bank_name})
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-sm text-[#001F5F]">
                          ${Number(tx.amount).toFixed(2)}
                          {tx.fee > 0 && <span className="text-[10px] text-slate-400 block font-normal">+${tx.fee.toFixed(2)} fee</span>}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : tx.status === "PENDING_OTP"
                                ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                                : tx.status === "REVERSED"
                                ? "bg-blue-100 text-[#004DA7] border border-blue-200"
                                : "bg-red-100 text-red-800 border border-red-200"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {tx.status === "PENDING_OTP" && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleTransactionAction(tx.id, "FORCE_APPROVE")}
                                className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition"
                                title="Bypass OTP and force complete wire transfer"
                              >
                                Force Approve
                              </button>
                              {isSuperAdmin ? (
                                <button
                                  onClick={() => handleTransactionAction(tx.id, "FORCE_CANCEL")}
                                  className="py-1 px-2 rounded-lg bg-[#E2231A] hover:bg-[#c81e16] text-white font-bold text-[10px] transition"
                                >
                                  Cancel
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="py-1 px-2 rounded-lg bg-slate-100 text-slate-400 font-bold text-[10px] cursor-not-allowed opacity-60 inline-flex items-center gap-1"
                                  title="Master Administrator privileges required to cancel wire transfers"
                                >
                                  <Lock className="w-2.5 h-2.5" /> Cancel
                                </button>
                              )}
                            </div>
                          )}

                          {tx.status === "COMPLETED" && (
                            isSuperAdmin ? (
                              <button
                                onClick={() => handleTransactionAction(tx.id, "REVERSE")}
                                className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-bold transition inline-flex items-center gap-1"
                                title="Reverse transaction and refund funds"
                              >
                                <RotateCcw className="w-3 h-3" /> Reverse
                              </button>
                            ) : (
                              <button
                                disabled
                                className="py-1 px-2 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 text-[10px] font-bold cursor-not-allowed opacity-60 inline-flex items-center gap-1"
                                title="Master Administrator privileges required to reverse settled transactions"
                              >
                                <Lock className="w-3 h-3" /> Reverse
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE OTP & SECURITY MONITOR */}
        {activeTab === "security" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-[#001F5F]">Live One-Time Passcode (OTP) Dispatch Monitor</h4>
                <p className="text-xs text-slate-500">Real-time status of two-factor authorization tokens</p>
              </div>
              <button
                onClick={loadOtpTokens}
                className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 border border-slate-200"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Tokens
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700 min-w-[940px]">
                <thead className="bg-slate-100 text-[#001F5F] uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">Customer &amp; Recipient Email</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Transaction Reference</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Purpose</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Expires At</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Attempts / State</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {otpTokens.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No OTP tokens generated yet
                      </td>
                    </tr>
                  ) : (
                    otpTokens.map((t) => {
                      const isExpired = new Date() > new Date(t.expires_at);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-[#001F5F] block">{t.full_name || "Customer"}</span>
                            <span className="font-mono text-slate-500 text-[11px]">{t.email}</span>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-[#004DA7]">
                            {t.reference_id}
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {t.purpose}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px]">
                            <span className={isExpired ? "text-red-600" : "text-emerald-700 font-bold"}>
                              {new Date(t.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-sans">{isExpired ? "Expired" : "Active"}</span>
                          </td>

                          <td className="py-3 px-4">
                            {t.verified === 1 ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                <Check className="w-3 h-3" /> Verified
                              </span>
                            ) : isExpired ? (
                              <span className="inline-block bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                Expired
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                Pending ({t.attempts}/{t.max_attempts} tries)
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {t.verified === 0 && !isExpired && (
                              <button
                                onClick={() => handleForceVerifyOtp(t.id)}
                                className="py-1 px-2.5 rounded-lg bg-[#004DA7] hover:bg-[#003882] text-white font-bold text-[10px] transition"
                              >
                                Force Verify
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Adjust Balance Modal */}
      {selectedCustomerForAdjustment && (
        <AdjustBalanceModal
          isOpen={!!selectedCustomerForAdjustment}
          onClose={() => setSelectedCustomerForAdjustment(null)}
          customer={selectedCustomerForAdjustment}
          onSuccess={() => {
            showFeedback("Account balance adjusted successfully");
            loadCustomers();
            loadStats();
          }}
        />
      )}

      {/* Reset Password Modal */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-[#001F5F]">Reset Customer Password</h3>
              <button onClick={() => setResetPassUser(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Set new login credentials for <strong>{resetPassUser.full_name}</strong> ({resetPassUser.email}).
            </p>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password (min 6 chars)"
                className="w-full text-xs py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#004DA7] focus:bg-white outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPassUser(null)}
                  className="py-2 px-3 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-[#001F5F] hover:bg-[#001438] text-xs font-bold text-white shadow-md shadow-[#001F5F]/20"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
