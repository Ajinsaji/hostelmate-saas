import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 to-rose-600 text-white text-xs py-2 px-4 flex items-center justify-center gap-2 shadow-lg animate-fadeIn">
      <WifiOff size={16} />
      <span className="font-bold">You are currently offline.</span>
      <span className="hidden sm:inline">Changes will automatically sync when network connection returns.</span>
    </div>
  );
}
