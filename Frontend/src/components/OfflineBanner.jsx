import React, { useState, useEffect, useRef } from "react";
import { useConnection, CONNECTION_STATES } from "../contexts/ConnectionContext";
import { WifiOff, AlertTriangle, CheckCircle2, Activity } from "lucide-react";

export default function OfflineBanner() {
  const { connectionState, openDiagnostic } = useConnection();
  const [showRestoredBanner, setShowRestoredBanner] = useState(false);
  const prevConnectionStateRef = useRef(connectionState);

  useEffect(() => {
    const prevState = prevConnectionStateRef.current;
    if (
      (prevState === CONNECTION_STATES.OFFLINE || prevState === CONNECTION_STATES.SERVER_UNAVAILABLE) &&
      connectionState === CONNECTION_STATES.ONLINE
    ) {
      setShowRestoredBanner(true);
      const timer = setTimeout(() => {
        setShowRestoredBanner(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    prevConnectionStateRef.current = connectionState;
  }, [connectionState]);

  if (showRestoredBanner) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9990] bg-emerald-600 text-white text-xs py-2 px-4 flex items-center justify-center gap-2 shadow-lg transition-all duration-300 animate-fadeIn">
        <CheckCircle2 size={16} />
        <span className="font-bold">Connection restored.</span>
        <span className="hidden sm:inline">HostelMate is connected and ready.</span>
      </div>
    );
  }

  if (connectionState === CONNECTION_STATES.OFFLINE) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9990] bg-gradient-to-r from-rose-700 via-rose-600 to-amber-700 text-white text-xs py-2 px-4 flex items-center justify-between shadow-lg transition-all duration-300">
        <div className="flex items-center gap-2 mx-auto">
          <WifiOff size={16} />
          <span className="font-bold">Connection lost.</span>
          <span className="hidden sm:inline">Check your Wi-Fi or mobile data connection.</span>
          <button
            onClick={openDiagnostic}
            className="ml-3 underline hover:text-slate-200 text-xs font-semibold cursor-pointer flex items-center gap-1"
          >
            <Activity size={12} /> Check Connection
          </button>
        </div>
      </div>
    );
  }

  if (connectionState === CONNECTION_STATES.SERVER_UNAVAILABLE) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9990] bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700 text-white text-xs py-2 px-4 flex items-center justify-between shadow-lg transition-all duration-300">
        <div className="flex items-center gap-2 mx-auto">
          <AlertTriangle size={16} />
          <span className="font-bold">HostelMate server unreachable.</span>
          <span className="hidden sm:inline">Your internet is working, but backend is temporarily unavailable.</span>
          <button
            onClick={openDiagnostic}
            className="ml-3 underline hover:text-slate-200 text-xs font-semibold cursor-pointer flex items-center gap-1"
          >
            <Activity size={12} /> Check Connection
          </button>
        </div>
      </div>
    );
  }

  return null;
}
