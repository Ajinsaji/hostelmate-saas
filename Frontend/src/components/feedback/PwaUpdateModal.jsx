import React, { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { motion, AnimatePresence } from "framer-motion";
import { DownloadCloud, X } from "lucide-react";

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

  const [availableVersion, setAvailableVersion] = useState("1.0.1"); // Default fallback
  const currentVersion = "1.0.0"; // App Version

  useEffect(() => {
    if (needRefresh) {
      // In a real application, you might fetch /version.json?t=Date.now() to dynamically display the available version.
      // For this Release Candidate, we will display 1.0.1 as a visual cue.
      setAvailableVersion("1.0.1");
    }
  }, [needRefresh]);

  if (!needRefresh) return null;

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleLater = () => {
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
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
                <DownloadCloud className="w-6 h-6 text-blue-400" />
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                🚀 New Version Available
              </h2>
              
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                A new version of HostelMate has been installed. Update now to enjoy the latest features, performance improvements, security updates, and bug fixes.
              </p>

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

              <div className="flex items-center gap-3">
                <button
                  onClick={handleLater}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition border border-transparent"
                >
                  Later
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                >
                  Update Now
                </button>
              </div>
            </div>
            <button
              onClick={handleLater}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
