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
  const lastPromptVersionRef = useRef(localStorage.getItem("pwa_prompt_version"));

  const shouldShow = useMemo(() => {
    // We only show the modal once per APP_VERSION unless the user refreshed after updating.
    return lastPromptVersionRef.current !== APP_VERSION;
  }, []);

  useEffect(() => {
    if (!shouldShow) return;

    if (!("serviceWorker" in navigator)) return;

    // Listen for vite-plugin-pwa events.
    const onNeedRefresh = (event) => {
      // Some versions include details like { type: 'updatefound' }.
      // We just show the UI.
      setIsOpen(true);
      // Store that we've shown for this APP_VERSION.
      try {
        localStorage.setItem("pwa_prompt_version", APP_VERSION);
        lastPromptVersionRef.current = APP_VERSION;
      } catch {
        // ignore
      }
    };

    window.addEventListener("pwa:need-refresh", onNeedRefresh);

    // Also force an update check on mount.
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.update()))
      .catch(() => {});

    return () => {
      window.removeEventListener("pwa:need-refresh", onNeedRefresh);
    };
  }, [shouldShow]);

  const doUpdateNow = async () => {
    setIsUpdating(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      // If vite-plugin-pwa marked the waiting SW, skipping waiting will activate it.
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
    // We'll allow future prompts after next deployment by not overwriting prompt version.
    // The app_version changes per deployment (CI can bump it).
  };

  return (
    <AppUpdateModal
      isOpen={isOpen && !isUpdating}
      onUpdate={doUpdateNow}
      onLater={onLater}
    />
  );
}

