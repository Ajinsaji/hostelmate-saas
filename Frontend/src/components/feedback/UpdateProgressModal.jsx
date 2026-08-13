import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

export default function UpdateProgressModal({ isOpen, status = "updating", onClose, onRetry }) {
  const prefersReduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm bg-[#0B1220] border border-[#202B45] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 border transition-all duration-300 ${
                status === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : status === "error"
                  ? "bg-rose-500/10 border-rose-500/30"
                  : "bg-blue-500/10 border-blue-500/20 shadow-[0_0_12px_rgba(37,99,235,0.08)]"
              }`}>
                {status === "success" ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" aria-hidden="true" />
                ) : status === "error" ? (
                  <AlertTriangle className="w-6 h-6 text-rose-400" aria-hidden="true" />
                ) : (
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" aria-hidden="true" />
                )}
              </div>

              <div aria-live="polite" aria-atomic="true">
                <h2 className="text-lg font-bold text-white mb-2">
                  {status === "success"
                    ? "✓ Update ready"
                    : status === "error"
                    ? "Update couldn't be completed"
                    : "Updating HostelMate"}
                </h2>

                <p className="text-sm text-[#94A3B8] mb-4">
                  {status === "success"
                    ? "Restarting HostelMate..."
                    : status === "error"
                    ? "Please check your connection and try again."
                    : "Installing the latest version..."}
                </p>

                {/* Indeterminate progress */}
                {status === "updating" && (
                  <div className="w-full bg-[#131C2E] border border-[#202B45] h-2 rounded-full overflow-hidden my-4 relative">
                    <div
                      className="h-full bg-[#22C55E] rounded-full absolute top-0"
                      style={{ animation: "pwaIndeterminateBar 1.6s infinite ease-in-out" }}
                    />
                    <style>{`
                      @keyframes pwaIndeterminateBar {
                        0% { left: -40%; width: 40%; }
                        50% { left: 30%; width: 50%; }
                        100% { left: 100%; width: 40%; }
                      }
                    `}</style>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-2">
                {status === "error" ? (
                  <>
                    <button
                      onClick={onClose}
                      className="flex-1 min-h-[44px] py-2 px-3 rounded-xl text-sm font-semibold text-[#94A3B8] bg-transparent border border-transparent hover:bg-white/5 transition"
                    >
                      Close
                    </button>
                    <button
                      onClick={onRetry}
                      className="flex-1 min-h-[44px] py-2 px-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.18)] transition"
                    >
                      Try Again
                    </button>
                  </>
                ) : status === "success" ? (
                  <button
                    onClick={onClose}
                    className="w-full min-h-[44px] py-2 px-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.18)] transition"
                  >
                    Done
                  </button>
                ) : (
                  <button
                    onClick={() => {}}
                    disabled
                    className="w-full min-h-[44px] py-2 px-3 rounded-xl text-sm font-semibold text-white bg-blue-600 opacity-80 cursor-default"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Installing...
                    </span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

