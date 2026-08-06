import { useState, useEffect } from "react";
import api from "../utils/apiClient";

export function useVersionChecker() {
  const CURRENT_APP_VERSION = "v3.2.1";
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

        // If mandatory, always show
        if (release.type === "mandatory") {
          setShowModal(true);
          return;
        }

        // If version is newer than last seen
        if (!lastSeenVersion || lastSeenVersion !== release.version) {
          // Check 24-hour reminder if optional
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
      console.error("useVersionChecker error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkVersion();
    }, 1000); // 1s delay post authentication
    return () => clearTimeout(timer);
  }, []);

  const handleUpdateNow = async () => {
    if (latestRelease?.version) {
      localStorage.setItem("lastSeenVersion", latestRelease.version);
      try {
        await api.patch("/api/v2/releases/mark-read", { version: latestRelease.version });
      } catch (err) {
        console.error(err);
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
    latestRelease,
    handleUpdateNow,
    handleLater,
    loading
  };
}
