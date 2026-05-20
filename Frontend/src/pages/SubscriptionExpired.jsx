import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import toast from "../services/toast";

const SubscriptionExpired = () => {
  const navigate = useNavigate();

  const state = useMemo(() => {
    try {
      return window?.history?.state || {};
    } catch {
      return {};
    }
  }, []);

  const [hostelName, setHostelName] = useState(state?.hostelName || "-");
  const [planType, setPlanType] = useState(state?.planType || "-");
  const [expiryDate, setExpiryDate] = useState(state?.expiryDate || "-");

  useEffect(() => {
    if (state?.hostelName) setHostelName(state.hostelName);
    if (state?.planType) setPlanType(state.planType);
    if (state?.expiryDate) setExpiryDate(state.expiryDate);
  }, [state]);

  const handleRenew = () => {
    toast.success("Renew flow not implemented yet");
    navigate("/subscription-setup");
  };

  const handleSupport = () => {
    toast.success("Support flow not implemented yet");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#081028", padding: 16, display: "flex", justifyContent: "center" }}>
      <div
        className="glass-card rounded-2xl p-6"
        style={{
          width: "100%",
          maxWidth: 820,
          marginTop: 48,
          background: "rgba(11,23,57,0.55)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <h1 className="text-h1" style={{ color: "white", margin: 0, fontWeight: 900 }}>
            Subscription Expired
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", marginTop: 8, marginBottom: 0 }}>
            Your HostelMate subscription has expired.
          </p>
        </div>

        <div style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 14 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 800 }}>Plan</div>
            <div style={{ color: "rgba(255,255,255,0.95)", fontWeight: 900, marginTop: 6 }}>{planType}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 14 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 800 }}>Expiry</div>
            <div style={{ color: "rgba(255,255,255,0.95)", fontWeight: 900, marginTop: 6 }}>{expiryDate}</div>
          </div>
        </div>

        <div style={{ marginTop: 12, background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 14 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 800 }}>Hostel</div>
          <div style={{ color: "rgba(255,255,255,0.95)", fontWeight: 900, marginTop: 6 }}>{hostelName}</div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 22 }}>
          <button className="btn-primary" onClick={handleRenew} style={{ padding: "10px 18px", fontWeight: 900 }}>
            Renew Subscription
          </button>
          <button
            className="btn-secondary"
            onClick={handleSupport}
            style={{ padding: "10px 18px", fontWeight: 900, background: "rgba(255,255,255,0.08)", color: "white", borderRadius: 12 }}
          >
            Contact Support
          </button>
        </div>

        <div style={{ marginTop: 14, color: "rgba(255,255,255,0.65)", fontSize: 12, textAlign: "center" }}>
          Renewal is enabled after the next lifecycle step.
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpired;

