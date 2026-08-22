import React from "react";
import { useConnection, CONNECTION_STATES } from "../contexts/ConnectionContext";
import { WifiOff, AlertTriangle, RefreshCw, Activity } from "lucide-react";

export default function ConnectionErrorScreen() {
  const { connectionState, isChecking, checkConnection, openDiagnostic } = useConnection();

  const isOffline = connectionState === CONNECTION_STATES.OFFLINE;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#081028] via-[#0B1220] to-[#081028] text-white p-6 overflow-hidden">
      {/* Background Decorative Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background: isOffline
            ? "radial-gradient(circle, #EF4444 0%, transparent 70%)"
            : "radial-gradient(circle, #F59E0B 0%, transparent 70%)",
        }}
      />

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 max-w-md w-full backdrop-blur-2xl bg-[#0B1220]/80 border border-[#202B45] rounded-3xl p-8 md:p-10 flex flex-col items-center text-center shadow-2xl">
        {/* Status Icon */}
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border shadow-lg ${
            isOffline
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              : "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          }`}
        >
          {isOffline ? <WifiOff size={40} /> : <AlertTriangle size={40} />}
        </div>

        {/* Status Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border ${
            isOffline
              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOffline ? "bg-rose-500 animate-pulse" : "bg-amber-500 animate-pulse"
            }`}
          />
          <span>{isOffline ? "Offline" : "Server unavailable"}</span>
        </div>

        {/* Title & Description */}
        <h1 className="text-2xl font-extrabold text-white mb-3 tracking-tight">
          {isOffline ? "No Internet Connection" : "Unable to Reach HostelMate"}
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed mb-8 max-w-sm">
          {isOffline
            ? "Your device doesn't appear to be connected to the internet. Please check your Wi-Fi or mobile data connection."
            : "Your internet connection appears to be working, but HostelMate is currently unreachable."}
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <div className="w-full flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => checkConnection(true)}
              disabled={isChecking}
              className="w-full sm:flex-1 min-h-[48px] px-5 py-3 rounded-2xl text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={16} className={isChecking ? "animate-spin" : ""} />
              <span>{isChecking ? "Testing..." : "Try Again"}</span>
            </button>

            <button
              onClick={() => {
                openDiagnostic();
                checkConnection(true);
              }}
              className="w-full sm:flex-1 min-h-[48px] px-5 py-3 rounded-2xl text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/60 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Activity size={16} className="text-slate-400" />
              <span>Check Connection</span>
            </button>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} className="text-slate-400" />
            <span>Refresh App</span>
          </button>
        </div>
      </div>
    </div>
  );
}
