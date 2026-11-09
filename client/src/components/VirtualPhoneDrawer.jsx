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
      const interval = setInterval(fetchFeed, 3000);
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
      <div className="relative w-full max-w-sm h-full bg-[#F4F6F9] border-l border-slate-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#001F5F] text-white flex items-center justify-between border-b border-[#001438]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sky-300">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Mobile Device</h3>
              <p className="text-[11px] text-slate-300">SMS Verification Feed</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchFeed}
              disabled={loading}
              title="Refresh SMS"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Bell className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No incoming messages</p>
              <p className="text-xs text-slate-400 mt-1">
                Initiate a transaction to receive SMS alerts.
              </p>
            </div>
          ) : (
            messages.map((sms) => {
              const otpMatch = sms.message.match(/\b\d{6}\b/);
              const otpCode = otpMatch ? otpMatch[0] : null;

              return (
                <div
                  key={sms.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#004DA7] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {sms.title || "SMS Alert"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(sms.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed mb-3">{sms.message}</p>
                  {otpCode && (
                    <button
                      onClick={() => copyToClipboard(otpCode, sms.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-mono font-bold text-slate-800 transition"
                    >
                      {copiedId === sms.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      {copiedId === sms.id ? "Copied" : `Autofill: ${otpCode}`}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
