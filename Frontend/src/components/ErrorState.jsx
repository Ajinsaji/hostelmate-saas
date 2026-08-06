import React from "react";
import { AlertTriangle, RefreshCcw, Lock, FileQuestion, WifiOff } from "lucide-react";

export default function ErrorState({
  type = "500",
  title = "Something went wrong",
  message = "An unexpected error occurred while loading this view.",
  onRetry
}) {
  const getIcon = () => {
    switch (type) {
      case "404": return FileQuestion;
      case "network": return WifiOff;
      case "permission": return Lock;
      default: return AlertTriangle;
    }
  };

  const Icon = getIcon();

  return (
    <div className="p-8 bg-[#162032] border border-[#22304A] rounded-3xl text-center space-y-4 text-white max-w-md mx-auto my-8">
      <div className="w-14 h-14 mx-auto bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center border border-rose-500/20">
        <Icon size={28} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-2"
        >
          <RefreshCcw size={14} /> Retry Request
        </button>
      )}
    </div>
  );
}
