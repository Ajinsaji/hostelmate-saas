import { useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { motion, AnimatePresence } from "framer-motion";
import { DownloadCloud, X, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

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

      // Request service worker update without auto-reload from virtual:pwa-register
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleLater}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              {/* Icon Status Header */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border transition-colors duration-300 bg-blue-500/10 border-blue-500/20">
                {updateSuccess ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : updateError ? (
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                ) : isUpdating ? (
                  <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                ) : (
                  <DownloadCloud className="w-6 h-6 text-blue-400" />
                )}
              </div>

              {/* Title & Body */}
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                {updateSuccess ? (
                  "✓ HostelMate updated successfully"
                ) : updateError ? (
                  "Update failed"
                ) : isUpdating ? (
                  "Updating HostelMate..."
                ) : (
                  "New version available"
                )}
              </h2>

              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                {updateSuccess ? (
                  "HostelMate updated successfully. Reloading application..."
                ) : updateError ? (
                  "Update failed. Please try again."
                ) : isUpdating ? (
                  "Updating HostelMate... Installing latest performance and security enhancements."
                ) : (
                  "A new version of HostelMate is ready. Update now to get the latest features, security, and bug fixes."
                )}
              </p>

              {/* Version Comparison Box */}
              <div className="flex justify-between items-center bg-slate-950 rounded-lg p-3 border border-white/5 mb-6">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Current</div>
                  <div className="text-xs font-mono text-slate-300">v{currentVersion}</div>
                </div>
                <div className="text-slate-600">→</div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Available</div>
                  <div className="text-xs font-mono font-bold text-emerald-400">v{availableVersion}</div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3">
                {!updateSuccess && (
                  <button
                    onClick={handleLater}
                    disabled={isUpdating}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition border border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Later
                  </button>
                )}

                <button
                  onClick={handleUpdate}
                  disabled={isUpdating || updateSuccess}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition flex items-center justify-center gap-2 ${
                    updateSuccess
                      ? "bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      : updateError
                      ? "bg-rose-600 hover:bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                      : "bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                  } disabled:opacity-75 disabled:cursor-not-allowed`}
                >
                  {isUpdating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {updateSuccess
                    ? "Reloading..."
                    : updateError
                    ? "Try Again"
                    : isUpdating
                    ? "Updating..."
                    : "Update App"}
                </button>
              </div>
            </div>

            {!isUpdating && !updateSuccess && (
              <button
                onClick={handleLater}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition"
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
