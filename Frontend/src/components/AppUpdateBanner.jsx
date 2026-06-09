import React, { useEffect, useMemo, useRef, useState } from "react";
import AppUpdateModal from "./AppUpdateModal";
import { APP_VERSION } from "../config/version";

/**
 * HostelMate PWA update prompt.
 * Uses vite-plugin-pwa's registrationType: 'prompt' lifecycle.
 */
export default function AppUpdateBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleRegistration = (reg) => {
      // If there is already a waiting service worker, show the update prompt.
      if (reg.waiting) {
        setIsOpen(true);
      }

      // Listen for new service worker installation
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed") {
              // Prompt for updates even if controller isn't available yet.
              // This avoids missing the update banner on Android Chrome / installed PWAs.
              setIsOpen(true);

            }
          });
        }
      });
    };

    // Check existing registrations and register update triggers on them
    navigator.serviceWorker.getRegistrations()
      .then((regs) => {
        regs.forEach((reg) => {
          handleRegistration(reg);
          // Force an update check on mount
          reg.update().catch(() => {});
        });
      })
      .catch(() => {});

    // Listen to pwa:need-refresh custom event as a fallback
    const onNeedRefresh = () => {
      setIsOpen(true);
    };
    window.addEventListener("pwa:need-refresh", onNeedRefresh);

    return () => {
      window.removeEventListener("pwa:need-refresh", onNeedRefresh);
    };
  }, []);

  const doUpdateNow = async () => {
    setIsUpdating(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      // Reload after activation.
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (e) {
      window.location.reload();
    }
  };

  const onLater = () => {
    setIsOpen(false);
  };

  return (
    <AppUpdateModal
      isOpen={isOpen && !isUpdating}
      onUpdate={doUpdateNow}
      onLater={onLater}
    />
  );
}

