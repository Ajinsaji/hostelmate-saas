import React from "react";
import { useConnection } from "../contexts/ConnectionContext";
import { CheckCircle2, XCircle, Minus, RefreshCw, X, ShieldAlert, Wifi, Server, UserCheck } from "lucide-react";

export default function ConnectionDiagnosticModal() {
  const {
    isDiagnosticOpen,
    closeDiagnostic,
    diagnosticData,
    isChecking,
    checkConnection,
  } = useConnection();

  if (!isDiagnosticOpen) return null;

  const { deviceOnline, serverAvailable, sessionValid, message } = diagnosticData;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={closeDiagnostic}
      />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="diagnostic-title"
        className="relative w-full max-w-md bg-[#0B1220] border border-[#202B45] rounded-3xl shadow-2xl overflow-hidden text-left p-6 md:p-8 z-10 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 id="diagnostic-title" className="text-lg font-bold text-white">
                Connection Diagnostic
              </h2>
              <p className="text-xs text-slate-400">Real-time status check</p>
            </div>
          </div>
          <button
            onClick={closeDiagnostic}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Diagnostic Items List */}
        <div className="space-y-3 mb-6">
          {/* 1. Device Internet */}
          <div className="flex items-center justify-between bg-[#131C2E] border border-[#202B45] p-3.5 rounded-2xl">
            <div className="flex items-center gap-3">
              <Wifi size={18} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-200">Device Internet</span>
            </div>
            <div>
              {deviceOnline === true && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={14} /> Connected
                </span>
              )}
              {deviceOnline === false && (
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                  <XCircle size={14} /> Offline
                </span>
              )}
              {deviceOnline === null && (
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-full">
                  <Minus size={14} /> Unchecked
                </span>
              )}
            </div>
          </div>

          {/* 2. HostelMate Server */}
          <div className="flex items-center justify-between bg-[#131C2E] border border-[#202B45] p-3.5 rounded-2xl">
            <div className="flex items-center gap-3">
              <Server size={18} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-200">HostelMate Server</span>
            </div>
            <div>
              {serverAvailable === true && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={14} /> Available
                </span>
              )}
              {serverAvailable === false && (
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  <XCircle size={14} /> Unavailable
                </span>
              )}
              {serverAvailable === null && (
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-full">
                  <Minus size={14} /> Unchecked
                </span>
              )}
            </div>
          </div>

          {/* 3. Account Session */}
          <div className="flex items-center justify-between bg-[#131C2E] border border-[#202B45] p-3.5 rounded-2xl">
            <div className="flex items-center gap-3">
              <UserCheck size={18} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-200">Account Session</span>
            </div>
            <div>
              {sessionValid === true && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={14} /> Valid
                </span>
              )}
              {sessionValid === false && (
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                  <XCircle size={14} /> Expired
                </span>
              )}
              {sessionValid === null && (
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-full">
                  <Minus size={14} /> Not checked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Summary Message */}
        <div className="bg-[#131C2E] rounded-2xl p-4 border border-[#202B45] mb-6">
          <p className="text-xs text-slate-300 leading-relaxed">
            {message || (
              deviceOnline && serverAvailable
                ? "Everything looks good. All connection components are operational."
                : "HostelMate connection diagnostic complete."
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={closeDiagnostic}
            className="flex-1 min-h-[44px] px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => checkConnection(true)}
            disabled={isChecking}
            className="flex-1 min-h-[44px] px-4 rounded-xl text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={isChecking ? "animate-spin" : ""} />
            <span>{isChecking ? "Testing..." : "Re-test Connection"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
