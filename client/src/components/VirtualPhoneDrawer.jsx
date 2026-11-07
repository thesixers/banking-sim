import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Smartphone, X, Bell, Copy, Check, RefreshCw } from "lucide-react";

export default function VirtualPhoneDrawer({ isOpen, onClose, onSelectOtp }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await api.otp.feed();
      setMessages(res.notifications || []);
    } catch (err) {
      console.error("Failed to load SMS feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFeed();
      const interval = setInterval(fetchFeed, 3000); // Poll feed every 3s when drawer is open
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const copyToClipboard = (code, id) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    if (onSelectOtp) onSelectOtp(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Phone Drawer Container */}
      <div className="relative w-full max-w-sm h-full bg-navy-900 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Phone Frame Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-navy-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Simulated Phone</h3>
              <p className="text-[11px] text-slate-400">Virtual SMS Inbox</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchFeed}
              disabled={loading}
              title="Refresh SMS"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Bell className="w-8 h-8 mb-2 stroke-1" />
              <p className="text-sm font-medium">No incoming messages yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Initiate an external transfer or top-up to receive simulated SMS OTPs.
              </p>
            </div>
          ) : (
            messages.map((sms) => {
              // Extract 6-digit OTP code if present in the message
              const otpMatch = sms.message.match(/\b\d{6}\b/);
              const otpCode = otpMatch ? otpMatch[0] : null;

              return (
                <div
                  key={sms.id}
                  className="bg-navy-950/80 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                      {sms.title || "SMS Alert"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(sms.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{sms.message}</p>

                  {otpCode && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between bg-slate-900/50 -mx-3.5 -mb-3.5 p-3 rounded-b-xl">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 font-mono">OTP:</span>
                        <span className="font-mono font-bold text-sm text-brand-400 tracking-wider">
                          {otpCode}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(otpCode, sms.id)}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white font-medium transition"
                      >
                        {copiedId === sms.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-300" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Auto-Fill
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-3 bg-navy-950 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400">
            🔒 Bank Simulator Sandbox: Simulated SMS is routed locally without third-party fees.
          </p>
        </div>
      </div>
    </div>
  );
}
