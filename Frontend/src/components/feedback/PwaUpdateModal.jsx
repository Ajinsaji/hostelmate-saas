import { useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { motion, AnimatePresence } from "framer-motion";
import { DownloadCloud, X, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function PwaUpdateModal() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered: ", r);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(false);
  const currentVersion = "1.0.0";
  const availableVersion = needRefresh ? "1.0.1" : "1.0.0";

  if (!needRefresh) return null;

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setUpdateError(false);
    setUpdateSuccess(false);

    try {
      if ("serviceWorker" in navigator) {
        const handleControllerChange = () => {
          setIsUpdating(false);
          setUpdateSuccess(true);
          setTimeout(() => {
            window.location.reload();
          }, 800);
        };
        navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange, { once: true });
      }

      await updateServiceWorker(false);

      // Safety fallback: if controllerchange doesn't fire within 3s, finish update & reload
      setTimeout(() => {
        setIsUpdating((prev) => {
          if (prev) {
            setUpdateSuccess(true);
            setTimeout(() => {
              window.location.reload();
            }, 600);
          }
          return false;
        });
      }, 3000);
    } catch (err) {
      console.error("PWA update failed:", err);
      setIsUpdating(false);
      setUpdateError(true);
    }
  };

  const handleLater = () => {
    if (isUpdating) return;
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <style>{`
            @keyframes pwaIndeterminateBar {
              0% { left: -40%; width: 40%; }
              50% { left: 30%; width: 50%; }
              100% { left: 100%; width: 40%; }
            }
          `}</style>
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/65 backdrop-blur-md"
            onClick={handleLater}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            aria-busy={isUpdating ? "true" : "false"}
            className="relative w-full max-w-sm bg-[#0B1220] border border-[#202B45] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              {/* Icon Status Header */}
              <div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border transition-all duration-300 ${
                  updateSuccess
                    ? "bg-emerald-500/15 border-emerald-500/30 scale-105"
                    : updateError
                    ? "bg-rose-500/15 border-rose-500/30"
                    : isUpdating
                    ? "bg-blue-500/15 border-blue-500/30"
                    : "bg-blue-500/10 border-blue-500/20"
                }`}
              >
                {updateSuccess ? (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-[#22C55E]" aria-hidden="true" />
                  </motion.div>
                ) : updateError ? (
                  <AlertTriangle className="w-6 h-6 text-rose-400" aria-hidden="true" />
                ) : isUpdating ? (
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" aria-hidden="true" />
                ) : (
                  <DownloadCloud className="w-6 h-6 text-blue-400" aria-hidden="true" />
                )}
              </div>

              {/* Title & Body with Live Region */}
              <div aria-live="polite" aria-atomic="true">
                <h2 className="text-xl font-bold text-[#FFFFFF] mb-2 flex items-center gap-2">
                  {updateSuccess ? (
                    "✓ HostelMate updated successfully"
                  ) : updateError ? (
                    "⚠ Update failed"
                  ) : isUpdating ? (
                    "Updating HostelMate..."
                  ) : (
                    "New version available"
                  )}
                </h2>

                <p className="text-sm text-[#94A3B8] mb-4 leading-relaxed">
                  {updateSuccess ? (
                    "Reloading application..."
                  ) : updateError ? (
                    "Unable to install the latest version. Please try again."
                  ) : isUpdating ? (
                    "Installing the latest version..."
                  ) : (
                    "A new version of HostelMate is ready. Update now to get the latest features, security, and bug fixes."
                  )}
                </p>

                {/* Animated Indeterminate Progress Bar */}
                {isUpdating && (
                  <div className="w-full bg-[#131C2E] border border-[#202B45] h-2 rounded-full overflow-hidden my-4 relative">
                    <div
                      className="h-full bg-[#22C55E] rounded-full absolute top-0"
                      style={{
                        animation: "pwaIndeterminateBar 1.6s infinite ease-in-out",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Version Comparison Box */}
              <div className="flex justify-between items-center bg-[#131C2E] rounded-xl p-3 border border-[#202B45] mb-6">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Current</div>
                  <div className="text-xs font-mono text-[#94A3B8]">v{currentVersion}</div>
                </div>
                <div className="text-[#64748B]">→</div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-[#22C55E] tracking-wider">Available</div>
                  <div className="text-xs font-mono font-bold text-[#22C55E]">v{availableVersion}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {!updateSuccess && (
                  <button
                    onClick={handleLater}
                    disabled={isUpdating}
                    className="flex-1 min-h-[48px] py-3 px-4 rounded-xl text-sm font-semibold text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-white/5 transition border border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Later
                  </button>
                )}

                <button
                  onClick={handleUpdate}
                  disabled={isUpdating || updateSuccess}
                  className={`flex-1 min-h-[48px] py-3 px-4 rounded-xl text-sm font-semibold text-[#FFFFFF] transition flex items-center justify-center gap-2 ${
                    updateSuccess
                      ? "bg-[#22C55E] shadow-[0_0_16px_rgba(34,197,94,0.4)]"
                      : updateError
                      ? "bg-rose-600 hover:bg-rose-500 shadow-[0_0_16px_rgba(225,29,72,0.4)]"
                      : "bg-blue-600 hover:bg-blue-500 shadow-[0_0_16px_rgba(37,99,235,0.4)]"
                  } disabled:opacity-75 disabled:cursor-not-allowed`}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Updating...</span>
                    </>
                  ) : updateSuccess ? (
                    <span>Reloading...</span>
                  ) : updateError ? (
                    <span>Try Again</span>
                  ) : (
                    <span>Update App</span>
                  )}
                </button>
              </div>
            </div>

            {!isUpdating && !updateSuccess && (
              <button
                onClick={handleLater}
                aria-label="Close update modal"
                className="absolute top-4 right-4 p-2 rounded-full text-[#64748B] hover:text-[#FFFFFF] hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
