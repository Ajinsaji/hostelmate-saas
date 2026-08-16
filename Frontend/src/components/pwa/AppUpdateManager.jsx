import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DownloadCloud, X, CheckCircle2, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { APP_VERSION } from "../../config/version";

const UPDATE_PROMPTED_SW_KEY = "pwa_update_prompted_sw";
const SW_UPDATE_LOOP_GUARD_KEY = "sw_update_applied_v1";

// Update State Machine
export const UPDATE_STATES = {
  IDLE: "IDLE",
  UPDATE_AVAILABLE: "UPDATE_AVAILABLE",
  UPDATING: "UPDATING",
  UPDATE_READY: "UPDATE_READY",
  UPDATE_FAILED: "UPDATE_FAILED",
};

export default function AppUpdateManager() {
  const [updateState, setUpdateState] = useState(UPDATE_STATES.IDLE);
  const waitingWorkerRef = useRef(null);
  const registrationRef = useRef(null);
  const isReloadingRef = useRef(false);
  const timeoutTimerRef = useRef(null);
  const lastCheckTimeRef = useRef(0);

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Single Safe Reload Execution
  const safeReload = useCallback(() => {
    if (isReloadingRef.current) return;
    isReloadingRef.current = true;
    try {
      sessionStorage.setItem(SW_UPDATE_LOOP_GUARD_KEY, "1");
    } catch {
      // ignore
    }
    window.location.reload();
  }, []);

  const showUpdatePrompt = useCallback((sw) => {
    if (!sw) return;
    const scriptUrl = sw.scriptURL || sw.url;
    try {
      const prompted = localStorage.getItem(UPDATE_PROMPTED_SW_KEY);
      if (scriptUrl && prompted === scriptUrl) {
        // Already prompted and dismissed for this exact script build in this browser
        return;
      }
    } catch {
      // ignore storage errors
    }

    waitingWorkerRef.current = sw;
    setUpdateState((prev) => {
      // Only transition to UPDATE_AVAILABLE if we're currently IDLE
      if (prev === UPDATE_STATES.IDLE) {
        return UPDATE_STATES.UPDATE_AVAILABLE;
      }
      return prev;
    });
  }, []);

  const handleRegistration = useCallback((reg) => {
    if (!reg) return;
    registrationRef.current = reg;

    // 1. Immediate check: if there is already a waiting service worker
    if (reg.waiting) {
      showUpdatePrompt(reg.waiting);
    }

    // 2. Listen for new service worker installation
    reg.addEventListener("updatefound", () => {
      const installingWorker = reg.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener("statechange", () => {
        if (
          installingWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          showUpdatePrompt(installingWorker);
        }
      });
    });
  }, [showUpdatePrompt]);

  // Check for SW updates (debounced, no aggressive intervals)
  const checkForUpdate = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    const now = Date.now();
    // Debounce checks to at most once per 30 seconds
    if (now - lastCheckTimeRef.current < 30000) return;
    lastCheckTimeRef.current = now;

    try {
      const reg = registrationRef.current || (await navigator.serviceWorker.getRegistration());
      if (reg) {
        registrationRef.current = reg;
        if (reg.waiting) {
          showUpdatePrompt(reg.waiting);
        } else {
          await reg.update().catch(() => {});
          if (reg.waiting) {
            showUpdatePrompt(reg.waiting);
          }
        }
      }
    } catch {
      // Ignore background check errors
    }
  }, [showUpdatePrompt]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Reset loop guard if the page loaded normally
    try {
      const wasUpdated = sessionStorage.getItem(SW_UPDATE_LOOP_GUARD_KEY);
      if (wasUpdated === "1") {
        sessionStorage.removeItem(SW_UPDATE_LOOP_GUARD_KEY);
      }
    } catch {
      // ignore
    }

    // Register / detect existing SW registration immediately
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (reg) {
          handleRegistration(reg);
        } else {
          // If not registered yet, listen for controller/registration
          navigator.serviceWorker.ready
            .then(handleRegistration)
            .catch(() => {});
        }
      })
      .catch(() => {});

    // Initial lightweight check after bootstrap
    const startupTimer = setTimeout(() => {
      checkForUpdate();
    }, 1500);

    // Event listeners for window focus and document visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdate();
      }
    };

    const handleFocus = () => {
      checkForUpdate();
    };

    const handleNeedRefresh = (event) => {
      const sw = event?.detail?.waiting || registrationRef.current?.waiting;
      if (sw) {
        showUpdatePrompt(sw);
      } else {
        checkForUpdate();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pwa:need-refresh", handleNeedRefresh);

    return () => {
      clearTimeout(startupTimer);
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pwa:need-refresh", handleNeedRefresh);
    };
  }, [checkForUpdate, handleRegistration, showUpdatePrompt]);

  // Execute Update Flow
  const handleUpdateClick = async () => {
    // ── Double-click protection ──────────────────────────────────────────────
    if (updateState === UPDATE_STATES.UPDATING || isReloadingRef.current) return;

    // STEP 1: IMMEDIATELY transition to UPDATING so user sees animation instantly
    setUpdateState(UPDATE_STATES.UPDATING);

    // Mark current SW as prompted
    const sw = waitingWorkerRef.current || registrationRef.current?.waiting;
    if (sw?.scriptURL) {
      try {
        localStorage.setItem(UPDATE_PROMPTED_SW_KEY, sw.scriptURL);
      } catch {
        // ignore
      }
    }

    // STEP 2: Register controllerchange listener for verified SW activation
    let didChange = false;
    const onControllerChange = () => {
      if (didChange) return;
      didChange = true;
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);

      // STEP 4: Transition to UPDATE_READY on controllerchange
      setUpdateState(UPDATE_STATES.UPDATE_READY);

      // STEP 5: Safe reload after short confirmation animation
      setTimeout(() => {
        safeReload();
      }, 600);
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange, {
        once: true,
      });
    }

    // Set 5-second timeout guard in case controllerchange doesn't fire
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    timeoutTimerRef.current = setTimeout(() => {
      if (!didChange && !isReloadingRef.current) {
        console.warn("[PWA] SW controllerchange timed out after 5000ms");
        setUpdateState(UPDATE_STATES.UPDATE_FAILED);
      }
    }, 5000);

    // STEP 3: Post SKIP_WAITING to waiting worker
    try {
      if (sw) {
        sw.postMessage({ type: "SKIP_WAITING" });
      } else if (registrationRef.current?.waiting) {
        registrationRef.current.waiting.postMessage({ type: "SKIP_WAITING" });
      } else {
        // Check active registration one more time
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        } else {
          // If no waiting worker was found, try updating registration
          await reg?.update();
          if (reg?.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        }
      }
    } catch (err) {
      console.error("[PWA] Error posting SKIP_WAITING:", err);
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      setUpdateState(UPDATE_STATES.UPDATE_FAILED);
    }
  };

  const handleLater = () => {
    if (updateState === UPDATE_STATES.UPDATING) return;
    const sw = waitingWorkerRef.current || registrationRef.current?.waiting;
    if (sw?.scriptURL) {
      try {
        localStorage.setItem(UPDATE_PROMPTED_SW_KEY, sw.scriptURL);
      } catch {
        // ignore
      }
    }
    setUpdateState(UPDATE_STATES.IDLE);
  };

  const handleRetry = () => {
    handleUpdateClick();
  };

  const handleCloseError = () => {
    setUpdateState(UPDATE_STATES.IDLE);
  };

  const isVisible = updateState !== UPDATE_STATES.IDLE;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <style>{`
            @keyframes pwaIndeterminateBar {
              0% { left: -40%; width: 40%; }
              50% { left: 25%; width: 55%; }
              100% { left: 100%; width: 40%; }
            }
          `}</style>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={updateState === UPDATE_STATES.UPDATE_AVAILABLE ? handleLater : undefined}
          />

          {/* Modal Container */}
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-busy={updateState === UPDATE_STATES.UPDATING ? "true" : "false"}
            className="relative w-full max-w-sm bg-[#0B1220] border border-[#202B45] rounded-2xl shadow-2xl overflow-hidden text-left"
          >
            <div className="p-6">
              {/* Icon Status Header */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border transition-all duration-300 ${
                  updateState === UPDATE_STATES.UPDATE_READY
                    ? "bg-emerald-500/15 border-emerald-500/30 scale-105"
                    : updateState === UPDATE_STATES.UPDATE_FAILED
                    ? "bg-rose-500/15 border-rose-500/30"
                    : updateState === UPDATE_STATES.UPDATING
                    ? "bg-blue-500/15 border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                    : "bg-blue-500/10 border-blue-500/20"
                }`}
              >
                {updateState === UPDATE_STATES.UPDATE_READY ? (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-[#22C55E]" aria-hidden="true" />
                  </motion.div>
                ) : updateState === UPDATE_STATES.UPDATE_FAILED ? (
                  <AlertTriangle className="w-6 h-6 text-rose-400" aria-hidden="true" />
                ) : updateState === UPDATE_STATES.UPDATING ? (
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" aria-hidden="true" />
                ) : (
                  <DownloadCloud className="w-6 h-6 text-blue-400" aria-hidden="true" />
                )}
              </div>

              {/* Title & Body with Accessible Live Region */}
              <div aria-live="polite" aria-atomic="true">
                <h2 className="text-xl font-bold text-[#FFFFFF] mb-2 flex items-center gap-2">
                  {updateState === UPDATE_STATES.UPDATE_READY
                    ? "✓ Update complete"
                    : updateState === UPDATE_STATES.UPDATE_FAILED
                    ? "⚠ Update couldn't be completed"
                    : updateState === UPDATE_STATES.UPDATING
                    ? "Updating HostelMate..."
                    : "New version available"}
                </h2>

                <p className="text-sm text-[#94A3B8] mb-4 leading-relaxed">
                  {updateState === UPDATE_STATES.UPDATE_READY
                    ? "Reloading application with latest updates..."
                    : updateState === UPDATE_STATES.UPDATE_FAILED
                    ? "The update could not be completed. Please check your connection and try again."
                    : updateState === UPDATE_STATES.UPDATING
                    ? "Applying update and caching latest resources..."
                    : "A new version of HostelMate is ready. Update now to get the latest features, security, and bug fixes."}
                </p>

                {/* Animated Indeterminate Progress Bar (No Fake Percentage) */}
                {updateState === UPDATE_STATES.UPDATING && (
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

              {/* Version Comparison Box (when prompt is available) */}
              {updateState === UPDATE_STATES.UPDATE_AVAILABLE && (
                <div className="flex justify-between items-center bg-[#131C2E] rounded-xl p-3 border border-[#202B45] mb-6">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Installed</div>
                    <div className="text-xs font-mono text-[#94A3B8]">v{APP_VERSION}</div>
                  </div>
                  <div className="text-[#64748B] font-bold">→</div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-[#22C55E] tracking-wider">Latest</div>
                    <div className="text-xs font-mono font-bold text-[#22C55E]">Ready</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {updateState === UPDATE_STATES.UPDATE_AVAILABLE && (
                  <>
                    <button
                      onClick={handleLater}
                      className="flex-1 min-h-[46px] py-2.5 px-4 rounded-xl text-sm font-semibold text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-white/5 transition border border-transparent"
                    >
                      Later
                    </button>
                    <button
                      onClick={handleUpdateClick}
                      className="flex-1 min-h-[46px] py-2.5 px-4 rounded-xl text-sm font-semibold text-[#FFFFFF] bg-blue-600 hover:bg-blue-500 shadow-[0_0_16px_rgba(37,99,235,0.4)] transition flex items-center justify-center gap-2"
                    >
                      <span>Update App</span>
                    </button>
                  </>
                )}

                {updateState === UPDATE_STATES.UPDATING && (
                  <button
                    disabled
                    className="w-full min-h-[46px] py-2.5 px-4 rounded-xl text-sm font-semibold text-[#FFFFFF] bg-blue-600/80 cursor-default flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(37,99,235,0.3)]"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Updating HostelMate...</span>
                  </button>
                )}

                {updateState === UPDATE_STATES.UPDATE_READY && (
                  <button
                    disabled
                    className="w-full min-h-[46px] py-2.5 px-4 rounded-xl text-sm font-semibold text-[#FFFFFF] bg-[#22C55E] cursor-default flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(34,197,94,0.4)]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reloading...</span>
                  </button>
                )}

                {updateState === UPDATE_STATES.UPDATE_FAILED && (
                  <>
                    <button
                      onClick={handleCloseError}
                      className="flex-1 min-h-[46px] py-2.5 px-4 rounded-xl text-sm font-semibold text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-white/5 transition border border-transparent"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleRetry}
                      className="flex-1 min-h-[46px] py-2.5 px-4 rounded-xl text-sm font-semibold text-[#FFFFFF] bg-rose-600 hover:bg-rose-500 shadow-[0_0_16px_rgba(225,29,72,0.4)] transition flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Try Again</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {updateState === UPDATE_STATES.UPDATE_AVAILABLE && (
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
