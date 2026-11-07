import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import AdjustBalanceModal from "./AdjustBalanceModal";
import {
  ShieldCheck,
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
} from "lucide-react";

export default function AdminPanel({ onBackToUserView }) {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("customers"); // "customers" | "ledger" | "security"
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
  const loadStats = async () => {
    try {
      const res = await api.admin.stats();
      setStats(res.stats || null);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    }
  };

  // Fetch customers
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.admin.users({ search: searchCustomer });
      setCustomers(res.users || []);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.admin.transactions({
        search: txSearch,
        status: txStatusFilter,
        type: txTypeFilter,
      });
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch OTP tokens
  const loadOtpTokens = async () => {
    try {
      setLoading(true);
      const res = await api.admin.otpTokens();
      setOtpTokens(res.tokens || []);
    } catch (err) {
      console.error("Failed to load OTP tokens:", err);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-navy-950/90 backdrop-blur-md border-b border-indigo-900/40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
                NOVA CENTRAL <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Admin Core</span>
              </span>
              <p className="text-[11px] text-slate-400">Master Liquidity, Vault, and Customer Administration</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {message && (
              <span className="hidden sm:inline-block text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl animate-fadeIn">
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
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            {onBackToUserView && (
              <button
                onClick={onBackToUserView}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                Exit to User View
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Telemetry Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Vault Liquidity</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-extrabold text-white">
              ${Number(stats?.vault_liquidity || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 block">Total Customer Deposits</span>
          </div>

          <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Customers</span>
              <Users className="w-4 h-4 text-brand-400" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-extrabold text-white">
              {stats?.total_customers || 0}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Active Profiles</span>
          </div>

          <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Volume Moved</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-extrabold text-white">
              ${Number(stats?.total_volume || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">{stats?.total_transactions || 0} Total Transactions</span>
          </div>

          <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending Wires</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className={`font-mono text-xl sm:text-2xl font-extrabold ${stats?.pending_wires > 0 ? "text-amber-400" : "text-white"}`}>
              {stats?.pending_wires || 0}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Awaiting OTP Authorization</span>
          </div>

          <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Frozen Accounts</span>
              <Lock className="w-4 h-4 text-rose-400" />
            </div>
            <div className={`font-mono text-xl sm:text-2xl font-extrabold ${stats?.frozen_accounts > 0 ? "text-rose-400" : "text-white"}`}>
              {stats?.frozen_accounts || 0}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Locked Debit Cards</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("customers")}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "customers" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Users className="w-4 h-4" /> Customers & Vault ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ledger" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Activity className="w-4 h-4" /> Global Ledger
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "security" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Live OTP & Security
          </button>
        </div>

        {/* TAB 1: CUSTOMERS DIRECTORY */}
        {activeTab === "customers" && (
          <div className="bg-navy-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            {/* Search Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                  placeholder="Search name, email, account#..."
                  className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-navy-950 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <span className="text-xs text-slate-400 font-medium">
                Showing {customers.length} customer records
              </span>
            </div>

            {/* Customers Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Customer Name & Email</th>
                    <th className="py-3 px-4">Account Number</th>
                    <th className="py-3 px-4">Available Balance</th>
                    <th className="py-3 px-4">Card & Status</th>
                    <th className="py-3 px-4 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No customers matching search criteria
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-900/40 transition">
                        {/* Name & Email */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block text-sm">{c.full_name}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{c.email}</span>
                          {c.role === "ADMIN" && (
                            <span className="inline-block mt-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              ADMIN
                            </span>
                          )}
                        </td>

                        {/* Account Number */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-semibold text-slate-200 block">{c.account_number}</span>
                          <span className="text-[10px] text-slate-500">Routing: {c.routing_number}</span>
                        </td>

                        {/* Balance */}
                        <td className="py-3 px-4">
                          <span className="font-mono text-base font-extrabold text-emerald-400 block">
                            ${Number(c.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-500">{c.transaction_count || 0} Transactions</span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {c.is_frozen === 1 ? (
                              <span className="inline-flex items-center gap-1 bg-rose-500/15 border border-rose-500/30 text-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <Lock className="w-3 h-3" /> Frozen
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Card: {c.card_number}</span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Adjust Balance Button */}
                            <button
                              onClick={() => setSelectedCustomerForAdjustment(c)}
                              className="flex items-center gap-1 py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition"
                              title="Add or modify balance"
                            >
                              <DollarSign className="w-3.5 h-3.5" /> Adjust Balance
                            </button>

                            {/* Freeze/Unfreeze Toggle */}
                            <button
                              onClick={() => handleToggleFreeze(c)}
                              className={`p-1.5 rounded-xl border transition ${
                                c.is_frozen === 1
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400"
                              }`}
                              title={c.is_frozen === 1 ? "Unfreeze Account" : "Freeze Account"}
                            >
                              {c.is_frozen === 1 ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => setResetPassUser(c)}
                              className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                              title="Reset Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {/* Delete User */}
                            {c.role !== "ADMIN" && (
                              <button
                                onClick={() => handleDeleteUser(c)}
                                className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Delete Customer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: MASTER LEDGER */}
        {activeTab === "ledger" && (
          <div className="bg-navy-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Filter ref#, memo, name..."
                  className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-navy-950 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                  className="text-xs py-2 px-3 rounded-xl bg-navy-950 border border-slate-700 text-white focus:border-indigo-500 outline-none"
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
                  className="text-xs py-2 px-3 rounded-xl bg-navy-950 border border-slate-700 text-white focus:border-indigo-500 outline-none"
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
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Ref ID & Time</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Parties</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-white block">{tx.reference_id}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(tx.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                            {tx.type}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5 truncate max-w-[120px]">{tx.description}</span>
                        </td>

                        <td className="py-3 px-4">
                          {tx.sender_name && (
                            <span className="text-slate-300 block">From: <strong>{tx.sender_name}</strong></span>
                          )}
                          {tx.recipient_name && (
                            <span className="text-slate-300 block">To: <strong>{tx.recipient_name}</strong></span>
                          )}
                          {tx.external_bank_details && (
                            <span className="text-slate-400 text-[11px] block">
                              Wire: {tx.external_bank_details.beneficiary_name} ({tx.external_bank_details.bank_name})
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-sm text-white">
                          ${Number(tx.amount).toFixed(2)}
                          {tx.fee > 0 && <span className="text-[10px] text-slate-500 block">+${tx.fee.toFixed(2)} fee</span>}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : tx.status === "PENDING_OTP"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                                : tx.status === "REVERSED"
                                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
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
                                className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition"
                                title="Bypass OTP and force complete wire transfer"
                              >
                                Force Approve
                              </button>
                              <button
                                onClick={() => handleTransactionAction(tx.id, "FORCE_CANCEL")}
                                className="py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {tx.status === "COMPLETED" && (
                            <button
                              onClick={() => handleTransactionAction(tx.id, "REVERSE")}
                              className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition inline-flex items-center gap-1"
                              title="Reverse transaction and refund funds"
                            >
                              <RotateCcw className="w-3 h-3" /> Reverse
                            </button>
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
          <div className="bg-navy-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Live One-Time Passcode (OTP) Dispatch Monitor</h4>
                <p className="text-xs text-slate-400">Real-time status of two-factor authorization tokens</p>
              </div>
              <button
                onClick={loadOtpTokens}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Tokens
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Customer & Recipient Email</th>
                    <th className="py-3 px-4">Transaction Reference</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4">Expires At</th>
                    <th className="py-3 px-4">Attempts / State</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {otpTokens.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No OTP tokens generated yet
                      </td>
                    </tr>
                  ) : (
                    otpTokens.map((t) => {
                      const isExpired = new Date() > new Date(t.expires_at);
                      return (
                        <tr key={t.id} className="hover:bg-slate-900/40 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-white block">{t.full_name || "Customer"}</span>
                            <span className="font-mono text-slate-400 text-[11px]">{t.email}</span>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                            {t.reference_id}
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              {t.purpose}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px]">
                            <span className={isExpired ? "text-rose-400" : "text-emerald-400 font-semibold"}>
                              {new Date(t.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                            <span className="text-[10px] text-slate-500 block">{isExpired ? "Expired" : "Active"}</span>
                          </td>

                          <td className="py-3 px-4">
                            {t.verified === 1 ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                <Check className="w-3 h-3" /> Verified
                              </span>
                            ) : isExpired ? (
                              <span className="inline-block bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                Expired
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                Pending ({t.attempts}/{t.max_attempts} tries)
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {t.verified === 0 && !isExpired && (
                              <button
                                onClick={() => handleForceVerifyOtp(t.id)}
                                className="py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-navy-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Reset Customer Password</h3>
              <button onClick={() => setResetPassUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
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
                className="w-full text-xs py-2.5 px-3.5 rounded-xl bg-navy-950 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPassUser(null)}
                  className="py-2 px-3 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30"
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
