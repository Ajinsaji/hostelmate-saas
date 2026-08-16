import { useState, useEffect } from "react";
import api from "../utils/apiClient";
import { APP_VERSION } from "../config/version";

export function useVersionChecker() {
  const CURRENT_APP_VERSION = `v${APP_VERSION}`;
  const [latestRelease, setLatestRelease] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkVersion = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v2/releases/latest");
      if (res.data?.success && res.data.release) {
        const release = res.data.release;
        setLatestRelease(release);

        const lastSeenVersion = localStorage.getItem("lastSeenVersion");
        const dismissedAt = localStorage.getItem("updateDismissedAt");

        // Mandatory releases always show
        if (release.type === "mandatory") {
          setShowModal(true);
          return;
        }

        // Newer version check
        if (!lastSeenVersion || lastSeenVersion !== release.version) {
          if (dismissedAt && release.type === "optional") {
            const hoursSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
            if (hoursSinceDismiss < 24) {
              setShowModal(false);
              return;
            }
          }
          setShowModal(true);
        }
      }
    } catch (err) {
      console.warn("useVersionChecker:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkVersion();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdateNow = async () => {
    if (latestRelease?.version) {
      localStorage.setItem("lastSeenVersion", latestRelease.version);
      try {
        await api.patch("/api/v2/releases/mark-read", { version: latestRelease.version });
      } catch (err) {
        console.warn(err);
      }
    }
    setShowModal(false);
    window.location.reload();
  };

  const handleLater = () => {
    localStorage.setItem("updateDismissedAt", Date.now().toString());
    setShowModal(false);
  };

  return {
    showModal,
    showUpdateModal: showModal,
    latestRelease,
    handleUpdateNow,
    handleLater,
    loading
  };
}

export default useVersionChecker;
