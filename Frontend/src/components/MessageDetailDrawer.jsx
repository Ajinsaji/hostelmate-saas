import React, { useState } from "react";
import { X, Send, AlertTriangle, CheckCircle, Clock, RefreshCw, Smartphone, ExternalLink, ShieldCheck } from "lucide-react";
import api from "../utils/apiClient";

export default function MessageDetailDrawer({ isOpen, onClose, communication, onRefresh }) {
  const [retrying, setRetrying] = useState(false);
  const [message, setMessage] = useState(null);

  if (!isOpen || !communication) return null;

  const handleRetry = async () => {
    try {
      setRetrying(true);
      setMessage(null);
      const res = await api.post(`/api/communication/whatsapp/retry/${communication._id}`);
      if (res.data?.success) {
        setMessage({ type: "success", text: "Retry dispatched successfully!" });
        if (onRefresh) onRefresh();
      } else {
        setMessage({ type: "error", text: res.data?.message || "Retry failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to retry message" });
    } finally {
      setRetrying(false);
    }
  };

  const handleOpenWaMe = async () => {
    if (communication.waMeUrl) {
      window.open(communication.waMeUrl, "_blank");
      try {
        await api.post("/api/communication/whatsapp/log-manual", { communicationId: communication._id });
        if (onRefresh) onRefresh();
      } catch (e) {
        // ignore logging errors
      }
    }
  };

  // Status color badge logic
  const getStatusBadge = (status) => {
    switch (status) {
      case "sent":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" /> Sent</span>;
      case "manual_opened":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><ExternalLink className="w-3 h-3 mr-1" /> Manual Link Opened</span>;
      case "pending_manual":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" /> Pending Manual Action</span>;
      case "sending":
      case "queued":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Queued / Sending</span>;
      case "failed":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><AlertTriangle className="w-3 h-3 mr-1" /> Delivery Failed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between transform transition-transform duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              Communication Audit Log
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {communication._id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
              {message.text}
            </div>
          )}

          {/* Status Overview Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Status</span>
              {getStatusBadge(communication.status)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Delivery Mode:</span>
              <span className="font-semibold uppercase tracking-wider text-slate-700">
                {communication.mode === "manual_wame" ? "Manual wa.me Link" : "Meta WhatsApp API"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Event Code:</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-semibold">
                {communication.businessEvent || communication.templateCode || "GENERAL"}
              </span>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recipient Information</h4>
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-semibold text-slate-800">{communication.recipientName || "Resident/Owner"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono text-slate-800 font-medium">{communication.recipient || communication.recipientPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hostel:</span>
                <span className="text-slate-800">{communication.hostelId?.hostelName || "HostelMate"}</span>
              </div>
              {communication.residentId?.roomNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Room:</span>
                  <span className="font-medium text-slate-800">Room {communication.residentId.roomNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Render Message Text Preview */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Message Content</h4>
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/80 font-sans text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {communication.messageBody || communication.customMessage || "Standard notification template compiled."}
            </div>
          </div>

          {/* Technical Metadata */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Audit Metadata</h4>
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Created At:</span>
                <span className="font-mono">{new Date(communication.createdAt).toLocaleString()}</span>
              </div>
              {communication.openedAt && (
                <div className="flex justify-between">
                  <span>Manual Link Clicked At:</span>
                  <span className="font-mono text-blue-600">{new Date(communication.openedAt).toLocaleString()}</span>
                </div>
              )}
              {communication.sentAt && (
                <div className="flex justify-between">
                  <span>Confirmed Sent At:</span>
                  <span className="font-mono text-emerald-600">{new Date(communication.sentAt).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Attempt Count:</span>
                <span className="font-bold">{communication.attemptCount || 1} / 3</span>
              </div>
              {communication.providerMessageId && (
                <div className="flex justify-between">
                  <span>Provider Msg ID:</span>
                  <span className="font-mono text-slate-800">{communication.providerMessageId}</span>
                </div>
              )}
              {communication.failureReason && (
                <div className="p-2 bg-rose-50 rounded border border-rose-200 text-rose-800 text-xs mt-2">
                  <span className="font-bold block">Failure Reason:</span>
                  {communication.failureReason}
                </div>
              )}
            </div>
          </div>

          {/* Security Banner */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Sensitive Meta Cloud API tokens and temporary passwords are never exposed in audit logs.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
          {communication.status === "pending_manual" && communication.waMeUrl && (
            <button
              onClick={handleOpenWaMe}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm text-sm transition"
            >
              <Send className="w-4 h-4" />
              Open WhatsApp Web / App
            </button>
          )}

          {communication.status === "failed" && (
            <button
              onClick={handleRetry}
              disabled={retrying || (communication.attemptCount >= 3)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm text-sm transition"
            >
              <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
              {retrying ? "Retrying..." : communication.attemptCount >= 3 ? "Max Retries Reached" : "Retry Delivery"}
            </button>
          )}

          <button
            onClick={onClose}
            className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
