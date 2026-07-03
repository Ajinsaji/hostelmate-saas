import React, { useEffect, useRef, useState } from "react";
import AppUpdateModal from "./AppUpdateModal";

const UPDATE_PROMPTED_SW_KEY = "pwa_update_prompted_sw";

export default function AppUpdateBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const promptedScriptUrlRef = useRef(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const getPromptedScriptUrl = () => {
      try {
        return localStorage.getItem(UPDATE_PROMPTED_SW_KEY);
      } catch {
        return null;
      }
    };

    const setPromptedScriptUrl = (scriptUrl) => {
      try {
        if (scriptUrl) {
          localStorage.setItem(UPDATE_PROMPTED_SW_KEY, scriptUrl);
        }
      } catch {
        // ignore
      }
    };

    const shouldPromptFor = (scriptUrl) => {
      if (!scriptUrl) return false;
      const prompted = getPromptedScriptUrl();
      return prompted !== scriptUrl;
    };

    const showUpdatePrompt = (scriptUrl) => {
      if (!shouldPromptFor(scriptUrl)) return;
      promptedScriptUrlRef.current = scriptUrl;
      setIsOpen(true);
    };

    const handleWaitingState = (waitingWorker) => {
      const scriptUrl = waitingWorker?.scriptURL || waitingWorker?.url;
      if (!scriptUrl) return;
      showUpdatePrompt(scriptUrl);
    };

    const handleRegistration = async (reg) => {
      if (!reg) return;

      if (reg.waiting) {
        handleWaitingState(reg.waiting);
      }

      reg.addEventListener("updatefound", () => {
        const installingWorker = reg.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", () => {
          if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
            handleWaitingState(installingWorker);
          }
        });
      });
    };

    navigator.serviceWorker.getRegistration().then(handleRegistration).catch(() => {});

    const onNeedRefresh = (event) => {
      const detailScriptUrl = event?.detail?.waiting?.scriptURL;
      if (detailScriptUrl) {
        showUpdatePrompt(detailScriptUrl);
      } else {
        navigator.serviceWorker.getRegistration().then((reg) => {
          handleRegistration(reg);
        });
      }
    };

    window.addEventListener("pwa:need-refresh", onNeedRefresh);

    return () => {
      window.removeEventListener("pwa:need-refresh", onNeedRefresh);
    };
  }, []);

  const markPrompted = () => {
    if (!promptedScriptUrlRef.current) return;
    try {
      localStorage.setItem(UPDATE_PROMPTED_SW_KEY, promptedScriptUrlRef.current);
    } catch {
      // ignore
    }
  };

  const doUpdateNow = async () => {
    setIsUpdating(true);
    markPrompted();
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (e) {
      window.location.reload();
    }
  };

  const onLater = () => {
    markPrompted();
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

