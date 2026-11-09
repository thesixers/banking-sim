import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  Mail,
  X,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  ArrowLeft,
  Clock,
  Inbox,
  Eye,
  CheckCheck,
} from "lucide-react";

export default function VirtualInboxDrawer({ isOpen, onClose, onSelectOtp, userEmail }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [viewMode, setViewMode] = useState("html"); // "html" | "text"

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await api.otp.feed();
      setMessages(res.notifications || []);
    } catch (err) {
      console.error("Failed to load inbox feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFeed();
      const interval = setInterval(fetchFeed, 3000);
      return () => clearInterval(interval);
    } else {
      setSelectedEmail(null);
    }
  }, [isOpen]);

  const extractOtp = (message, html) => {
    const text = message || "";
    const match = text.match(/\b\d{6}\b/);
    if (match) return match[0];
    if (html) {
      const htmlMatch = html.match(/>(\d{6})</);
      if (htmlMatch) return htmlMatch[1];
    }
    return null;
  };

  const copyOtp = (e, code, id) => {
    e?.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    if (onSelectOtp) onSelectOtp(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const markAllRead = async () => {
    try {
      await api.otp.markRead();
      setMessages((prev) => prev.map((m) => ({ ...m, is_read: 1 })));
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Drawer Container */}
      <div className="relative w-full max-w-lg h-full bg-[#F4F6F9] border-l border-slate-200 shadow-2xl flex flex-col">
        {/* Header: First Horizon Deep Navy */}
        <div className="px-5 py-4 bg-[#001F5F] text-white flex items-center justify-between border-b border-[#001438] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-sky-300">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">First Horizon Message Center</h3>
              <p className="text-[11px] text-slate-300 font-mono">{userEmail || "customer@firsthorizon.com"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchFeed}
              disabled={loading}
              title="Refresh Inbox"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={markAllRead}
              title="Mark All Read"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Email Detailed View */}
        {selectedEmail ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F6F9]">
            {/* Action Bar */}
            <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
              <button
                onClick={() => setSelectedEmail(null)}
                className="inline-flex items-center gap-1.5 text-slate-700 hover:text-[#001F5F] font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Messages
              </button>

              <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-[11px]">
                <button
                  onClick={() => setViewMode("html")}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${
                    viewMode === "html" ? "bg-[#001F5F] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  HTML Preview
                </button>
                <button
                  onClick={() => setViewMode("text")}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${
                    viewMode === "text" ? "bg-[#001F5F] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Plain Text
                </button>
              </div>
            </div>

            {/* Email Header Info */}
            <div className="p-4 border-b border-slate-200 bg-white">
              <h4 className="text-sm font-extrabold text-[#001F5F] mb-1.5">
                {selectedEmail.subject || selectedEmail.title}
              </h4>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>From: <strong className="text-slate-800">First Horizon Security Alerts</strong> &lt;alerts@firsthorizon.com&gt;</span>
                <span>{new Date(selectedEmail.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>

            {/* OTP Quick Copy Banner if present */}
            {(() => {
              const code = extractOtp(selectedEmail.message, selectedEmail.html_content);
              if (!code) return null;
              return (
                <div className="p-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#004DA7]" />
                    <span className="text-xs text-slate-800 font-medium">
                      Authorization Code: <strong className="font-mono text-[#001F5F] tracking-wider text-base">{code}</strong>
                    </span>
                  </div>
                  <button
                    onClick={(e) => copyOtp(e, code, selectedEmail.id)}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#004DA7] hover:bg-[#003882] text-white text-xs font-bold shadow-sm transition"
                  >
                    {copiedId === selectedEmail.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === selectedEmail.id ? "Autofilled!" : "Autofill Code"}
                  </button>
                </div>
              );
            })()}

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {viewMode === "html" && selectedEmail.html_content ? (
                <div
                  className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white text-slate-900"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html_content }}
                />
              ) : (
                <pre className="text-xs font-mono text-slate-800 bg-white p-4 rounded-2xl border border-slate-200 whitespace-pre-wrap leading-relaxed shadow-sm">
                  {selectedEmail.message}
                </pre>
              )}
            </div>
          </div>
        ) : (
          /* Email List Feed */
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Inbox className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
                <p className="text-sm font-bold text-slate-600">No messages in inbox</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Initiate a wire transfer or security event to receive authorization passcodes and account alerts here.
                </p>
              </div>
            ) : (
              messages.map((item) => {
                const otp = extractOtp(item.message, item.html_content);
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEmail(item)}
                    className={`p-4 rounded-2xl border transition cursor-pointer relative group ${
                      item.is_read
                        ? "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                        : "bg-white border-[#004DA7]/40 hover:border-[#004DA7] shadow-md ring-1 ring-[#004DA7]/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#E2231A] animate-pulse" />
                        )}
                        <span className="text-xs font-extrabold text-[#001F5F] line-clamp-1">
                          {item.subject || item.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                      {item.message}
                    </p>

                    {/* Bottom row: OTP badge or view email */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      {otp ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-[#001F5F]/10 border border-[#001F5F]/20 text-[#001F5F] font-bold px-2 py-0.5 rounded-md text-xs tracking-wider">
                            {otp}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => copyOtp(e, otp, item.id)}
                            className="flex items-center gap-1 text-xs text-[#004DA7] hover:text-[#003882] transition font-bold"
                          >
                            {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            {copiedId === item.id ? "Copied" : "Copy"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Official Banking Notice</span>
                      )}

                      <span className="inline-flex items-center gap-1 text-[#004DA7] group-hover:text-[#003882] text-xs font-bold">
                        <Eye className="w-3 h-3" /> View
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
