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
  Sparkles,
  Inbox,
  AlertCircle,
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
    // Look for 6-digit number in message or html
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
      <div className="relative w-full max-w-lg h-full bg-navy-900 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-navy-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Simulated Email Inbox</h3>
              <p className="text-[11px] text-slate-400 font-mono">{userEmail || "customer@novabank.com"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchFeed}
              disabled={loading}
              title="Refresh Inbox"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={markAllRead}
              title="Mark All Read"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Email Detailed View */}
        {selectedEmail ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-navy-950/40">
            {/* Action Bar */}
            <div className="p-3 bg-navy-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => setSelectedEmail(null)}
                className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Inbox
              </button>

              <div className="flex items-center gap-1 bg-navy-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
                <button
                  onClick={() => setViewMode("html")}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    viewMode === "html" ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  HTML Preview
                </button>
                <button
                  onClick={() => setViewMode("text")}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    viewMode === "text" ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Plain Text
                </button>
              </div>
            </div>

            {/* Email Header Info */}
            <div className="p-4 border-b border-slate-800 bg-navy-900/60">
              <h4 className="text-sm font-bold text-white mb-1.5">
                {selectedEmail.subject || selectedEmail.title}
              </h4>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>From: <strong>Nova Bank Security Core</strong> &lt;no-reply@novabank.com&gt;</span>
                <span>{new Date(selectedEmail.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>

            {/* OTP Quick Copy Banner if present */}
            {(() => {
              const code = extractOtp(selectedEmail.message, selectedEmail.html_content);
              if (!code) return null;
              return (
                <div className="p-3 bg-brand-500/10 border-b border-brand-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-brand-400" />
                    <span className="text-xs text-slate-200">
                      Detected OTP: <strong className="font-mono text-brand-300 tracking-wider text-sm">{code}</strong>
                    </span>
                  </div>
                  <button
                    onClick={(e) => copyOtp(e, code, selectedEmail.id)}
                    className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition"
                  >
                    {copiedId === selectedEmail.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === selectedEmail.id ? "Autofilled!" : "Autofill OTP"}
                  </button>
                </div>
              );
            })()}

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {viewMode === "html" && selectedEmail.html_content ? (
                <div
                  className="rounded-xl overflow-hidden shadow-inner bg-white text-slate-900"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html_content }}
                />
              ) : (
                <pre className="text-xs font-mono text-slate-300 bg-navy-950 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedEmail.message}
                </pre>
              )}
            </div>
          </div>
        ) : (
          /* Email List Feed */
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Inbox className="w-10 h-10 mb-2 stroke-1 text-slate-600" />
                <p className="text-sm font-medium text-slate-400">Your simulated inbox is empty</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Trigger an external transfer or account action to receive security OTPs and transaction alerts here.
                </p>
              </div>
            ) : (
              messages.map((item) => {
                const otp = extractOtp(item.message, item.html_content);
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEmail(item)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer relative group ${
                      item.is_read
                        ? "bg-navy-950/70 border-slate-800 hover:border-slate-700"
                        : "bg-navy-900/90 border-brand-500/30 hover:border-brand-500/60 shadow-lg shadow-brand-500/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                        )}
                        <span className="text-xs font-bold text-white line-clamp-1">
                          {item.subject || item.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 flex-shrink-0">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                      {item.message}
                    </p>

                    {/* Bottom row: OTP badge or view email */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                      {otp ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-brand-500/15 border border-brand-500/30 text-brand-300 font-bold px-2 py-0.5 rounded-md text-xs tracking-wider">
                            {otp}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => copyOtp(e, otp, item.id)}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition font-medium"
                          >
                            {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedId === item.id ? "Copied" : "Copy"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">Official Banking Notice</span>
                      )}

                      <span className="inline-flex items-center gap-1 text-brand-400 group-hover:text-brand-300 text-xs font-medium">
                        <Eye className="w-3 h-3" /> View Email
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
