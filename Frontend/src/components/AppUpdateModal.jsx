import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

const theme = {
  navy: "#0b2038",
  navy2: "#092032",
  emerald: "#10b981",
  emeraldDeep: "#04211a",
  text: "#ffffff",
  stroke: "rgba(255,255,255,0.14)",
};

function SupportsWaitingState() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    typeof window.location?.reload === "function"
  );
}

export default function AppUpdateModal({ onUpdate, onLater, isOpen }) {
  const [animState, setAnimState] = useState("closed");

  useEffect(() => {
    if (!isOpen) {
      setAnimState("closed");
      return;
    }
    setAnimState("open");
  }, [isOpen]);

  if (!isOpen) return null;

  const containerStyle = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 12,
    zIndex: 10000,
    display: "flex",
    justifyContent: "center",
    padding: "0 12px",
    pointerEvents: "none",
  };

  const sheetStyle = {
    pointerEvents: "auto",
    width: "100%",
    maxWidth: 520,
    background: `linear-gradient(90deg, ${theme.navy}, ${theme.navy2})`,
    color: theme.text,
    borderRadius: 16,
    boxShadow: "0 14px 40px rgba(2,6,23,0.55)",
    border: `1px solid ${theme.stroke}`,
    transform:
      animState === "open" ? "translateY(0)" : "translateY(18px)",
    opacity: animState === "open" ? 1 : 0,
    transition: "transform 260ms ease, opacity 260ms ease",
    padding: "12px 14px",
  };

  const titleStyle = {
    fontWeight: 800,
    fontSize: 14,
    lineHeight: 1.3,
  };

  const subtitleStyle = {
    marginTop: 2,
    fontSize: 12,
    opacity: 0.9,
  };

  const actionsStyle = {
    marginTop: 10,
    display: "flex",
    gap: 10,
  };

  const btnBase = {
    flex: 1,
    height: 38,
    borderRadius: 12,
    fontWeight: 800,
    cursor: "pointer",
    border: "none",
  };

  const updateBtn = {
    ...btnBase,
    background: theme.emerald,
    color: theme.emeraldDeep,
  };

  const laterBtn = {
    ...btnBase,
    background: "transparent",
    color: theme.text,
    border: `1px solid ${theme.stroke}`,
  };

  return (
    <div style={containerStyle} role="dialog" aria-live="polite">
      <div style={sheetStyle}>
        <div>
          <div style={titleStyle}>New version available</div>
          <div style={subtitleStyle}>Update HostelMate to get the latest improvements.</div>
        </div>
        <div style={actionsStyle}>
          <button style={updateBtn} onClick={onUpdate}>
            Update Now
          </button>
          <button style={laterBtn} onClick={onLater}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

