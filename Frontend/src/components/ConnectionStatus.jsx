import React from "react";
import { useConnection, CONNECTION_STATES } from "../contexts/ConnectionContext";
import { Activity, WifiOff, AlertTriangle } from "lucide-react";

export default function ConnectionStatus({ className = "" }) {
  const { connectionState, isChecking, openDiagnostic } = useConnection();

  const getStatusConfig = () => {
    switch (connectionState) {
      case CONNECTION_STATES.ONLINE:
        return {
          label: "Online",
          colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
          dotClass: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
          icon: Activity,
        };
      case CONNECTION_STATES.OFFLINE:
        return {
          label: "Offline",
          colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/30",
          dotClass: "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
          icon: WifiOff,
        };
      case CONNECTION_STATES.SERVER_UNAVAILABLE:
        return {
          label: "Server unavailable",
          colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/30",
          dotClass: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
          icon: AlertTriangle,
        };
      default:
        return {
          label: "Checking...",
          colorClass: "text-slate-400 bg-slate-500/10 border-slate-500/30",
          dotClass: "bg-slate-400 animate-pulse",
          icon: Activity,
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <button
      onClick={openDiagnostic}
      type="button"
      title="Click to view connection diagnostics"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 hover:scale-105 cursor-pointer bg-[#0B1220] ${config.colorClass} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
      <IconComponent className="w-3.5 h-3.5 opacity-80" />
      <span>{isChecking ? "Checking..." : config.label}</span>
    </button>
  );
}
