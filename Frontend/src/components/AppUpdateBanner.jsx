import React, { useEffect, useRef, useState } from "react";
import AppUpdateModal from "./AppUpdateModal";
import UpdateProgressModal from "./feedback/UpdateProgressModal";

const UPDATE_PROMPTED_SW_KEY = "pwa_update_prompted_sw";

export default function AppUpdateBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
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

    navigator.serviceWorker.getRegistration("/sw.js").then(handleRegistration).catch(() => {});

    const onNeedRefresh = (event) => {
      const detailScriptUrl = event?.detail?.waiting?.scriptURL;
      if (detailScriptUrl && detailScriptUrl.endsWith("/sw.js")) {
        showUpdatePrompt(detailScriptUrl);
      } else {
        navigator.serviceWorker.getRegistration("/sw.js").then((reg) => {
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
    if (isUpdating) return;
    setIsUpdating(true);
    setUpdateError(false);
    setUpdateSuccess(false);
    markPrompted();

    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");

      // Listen for the new service worker to take control, then reload.
      let didReload = false;
      const onControllerChange = () => {
        if (didReload) return;
        didReload = true;
        setIsUpdating(false);
        setUpdateSuccess(true);
        try {
          // show success briefly then reload
          setTimeout(() => window.location.reload(), 600);
        } catch {
          window.location.reload();
        }
      };

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange, { once: true });
      }

      if (reg?.waiting) {
        // Tell waiting worker to skip waiting and activate.
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      } else if (reg?.installing) {
        // If installing, wait for it to reach installed state then skipWaiting.
        const installing = reg.installing;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            try {
              installing.postMessage?.({ type: "SKIP_WAITING" });
            } catch {
              // ignore
            }
          }
        });
      } else if (reg) {
        // Try to trigger an update which may create a waiting worker.
        try {
          await reg.update();
          // if update created waiting, signal it after a short delay
          const maybeWaiting = reg.waiting;
          if (maybeWaiting) maybeWaiting.postMessage({ type: "SKIP_WAITING" });
        } catch {
          // ignore update errors here; fallback below
        }
      }

      // Fallback: if controllerchange doesn't fire, show an error after a timeout
      setTimeout(() => {
        if (isUpdating) {
          setIsUpdating(false);
          setUpdateError(true);
        }
      }, 3500);
    } catch (e) {
      setIsUpdating(false);
      setUpdateError(true);
    }
  };

  const onLater = () => {
    markPrompted();
    setIsOpen(false);
    setUpdateError(false);
    setUpdateSuccess(false);
  };

  return (
    <>
      <AppUpdateModal
        isOpen={isOpen && !isUpdating && !updateError && !updateSuccess}
        onUpdate={doUpdateNow}
        onLater={onLater}
      />
      <UpdateProgressModal
        isOpen={isUpdating || updateError || updateSuccess}
        status={updateSuccess ? "success" : updateError ? "error" : "updating"}
        onClose={() => {
          // allow closing error/success states
          setIsUpdating(false);
          setUpdateError(false);
          setUpdateSuccess(false);
          setIsOpen(false);
        }}
        onRetry={() => {
          setUpdateError(false);
          doUpdateNow();
        }}
      />
    </>
  );
}

