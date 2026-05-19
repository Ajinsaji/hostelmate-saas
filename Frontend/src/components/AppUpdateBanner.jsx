import React, { useEffect, useState } from "react";
import { APP_VERSION } from "../config/version";

export default function AppUpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("app_version");
      if (stored !== APP_VERSION) {
        // Do not overwrite stored version yet — prompt the user first.
        setUpdateAvailable(true);

        // Trigger SW update checks
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then((regs) => {
            regs.forEach((r) => {
              try {
                r.update();
              } catch (e) {
                // ignore
              }
            });
          });
        }

        // Clean outdated caches in background for safety (non-blocking)
        if (window.caches) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              try {
                if (!String(name).includes(APP_VERSION)) {
                  caches.delete(name);
                }
              } catch (e) {
                // ignore
              }
            });
          });
        }
      }
    } catch (e) {
      // ignore
      // Don't block rendering on any error
    }
  }, []);

  const doRefresh = () => {
    try {
      setIsUpdating(true);
      // Set the version so next load doesn't re-prompt
      localStorage.setItem("app_version", APP_VERSION);

      // Try to update service workers before reload
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => {
            try {
              r.update();
            } catch (e) {
              // ignore
            }
          });
        });
      }

      // small delay to allow SW assets to settle
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (e) {
      // fallback
      window.location.reload();
    }
  };

  if (!updateAvailable) return null;

  return (
    <div style={styles.container} role="status" aria-live="polite">
      <div style={styles.content}>
        <div style={styles.text}>
          New version available
        </div>
        <div style={styles.actions}>
          <button style={styles.refresh} onClick={doRefresh} disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Refresh App"}
          </button>
          <button
            style={styles.dismiss}
            onClick={() => setUpdateAvailable(false)}
            aria-label="Dismiss update notice"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 16,
    display: "flex",
    justifyContent: "center",
    zIndex: 9999,
    pointerEvents: "none",
  },
  content: {
    pointerEvents: "auto",
    background: "linear-gradient(90deg,#0b2038, #092032)",
    color: "#fff",
    padding: "12px 14px",
    borderRadius: 12,
    boxShadow: "0 6px 18px rgba(2,6,23,0.6)",
    display: "flex",
    gap: 12,
    alignItems: "center",
    maxWidth: 840,
    width: "calc(100% - 32px)",
  },
  text: {
    fontWeight: 700,
    fontSize: 14,
  },
  actions: {
    marginLeft: "auto",
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  refresh: {
    background: "#10b981",
    border: "none",
    color: "#04211a",
    padding: "8px 12px",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  },
  dismiss: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: 10,
    cursor: "pointer",
  },
};
