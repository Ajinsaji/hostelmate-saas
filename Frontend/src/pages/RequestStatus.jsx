import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../services/api";


const statusToUi = {
  pending: {
    text: "🟡 Application Under Review",
  },
  approved: {
    text: "🟢 Documents Approved",
  },
  activation_pending: {
    text: "🟢 Waiting For Activation",
  },
  activated: {
    text: "🎉 Hostel Activated",
  },
  rejected: {
    text: "🔴 Request Rejected",
  },
};

function RequestStatus() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusData, setStatusData] = useState(null);

  const phoneFromStorage = useMemo(() => {
    try {
      return localStorage.getItem("hostelRequestPhone");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const phone = phoneFromStorage;

    if (!phone) {
      setLoading(false);
      setError("No saved request found on this device.");
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const res = await api.get(`/api/hostel-request/status/${encodeURIComponent(phone)}`);
        if (!mounted) return;
        setStatusData(res.data);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || "Failed to load request status");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [phoneFromStorage]);

  const ui = statusData?.status ? statusToUi[statusData.status] : null;

  const submittedAt = statusData?.submittedAt
    ? new Date(statusData.submittedAt)
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#081028",
        paddingBottom: "110px",
        fontFamily: "Poppins",
        color: "white",
      }}
    >
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="gradient-header mb-6 rounded-[32px] border border-white/10 bg-white/5 py-7 shadow-2xl shadow-slate-900/40">
          <h1 className="text-h1" style={{ color: "white" }}>
            Request Status
          </h1>
          <p style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.7 }}>
            Track your hostel application and activation progress.
          </p>
        </div>

        {loading ? (
          <div className="text-center p-8 glass-card animate-pulse" style={{ background: "rgba(11,23,57,0.55)", borderColor: "rgba(255,255,255,0.08)" }}>
            Loading status...
          </div>
        ) : error ? (
          <div className="text-center p-8 card" style={{ background: "var(--bg-2)" }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>⚠️ {error}</div>
            <button
              type="button"
              className="px-4 py-3 rounded-xl font-semibold"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#fff",
              }}
              onClick={() => navigate("/register")}
            >
              Back
            </button>

          </div>

        ) : !statusData?.success ? (
          <div className="text-center p-8 card" style={{ background: "var(--bg-2)" }}>
            No status found.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-slate-900/40">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CardLine label="Hostel Name" value={statusData.hostelName || "-"} />
                <CardLine label="Phone" value={statusData.phone || "-"} />
                <CardLine label="Current Status" value={ui?.text || statusData.status || "-"} />
                <CardLine
                  label="Submitted Date"
                  value={submittedAt ? submittedAt.toLocaleString() : "-"}
                />
              </div>
            </div>

            {statusData.status === "activated" ? (

              <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-slate-900/40 flex flex-col items-center text-center">
                <div style={{ fontSize: 34, lineHeight: 1, marginBottom: 10 }}>
                  🎉 Hostel Activated
                </div>
                <div style={{ width: "100%", maxWidth: 420 }}>
                  <div className="mt-3">
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                      Hostel Name
                    </div>
                    <div style={{ marginTop: 6, fontSize: 16, fontWeight: 800 }}>{statusData.hostelName || "-"}</div>
                  </div>
                  <div className="mt-4">
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                      Phone Number
                    </div>
                    <div style={{ marginTop: 6, fontSize: 16, fontWeight: 800 }}>{statusData.phone || "-"}</div>
                  </div>
                  <div className="mt-4">
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                      Status
                    </div>
                    <div style={{ marginTop: 6, fontSize: 16, fontWeight: 800 }}>Activated</div>
                  </div>
                  <div style={{ marginTop: 14, color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.6 }}>
                    Your hostel is now active.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary mt-6 w-full flex items-center justify-center gap-2 rounded-3xl px-5 py-3 text-sm font-semibold"
                  onClick={() => navigate("/login")}
                >
                  Login Now
                </button>
              </div>
            ) : statusData.status === "approved" ? (
              <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-slate-900/40 flex flex-col items-center text-center">
                <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 10 }}>🟢 Documents Approved</div>
                <div style={{ width: "100%", maxWidth: 420 }}>
                  <div style={{ marginTop: 4, color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.6 }}>
                    Your application has been approved.
                    <br />
                    Waiting for final activation.
                  </div>
                </div>
              </div>
            ) : statusData.status === "activation_pending" ? (
              <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-slate-900/40 flex flex-col items-center text-center">
                <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 10 }}>🟢 Waiting For Activation</div>
                <div style={{ width: "100%", maxWidth: 420 }}>
                  <div style={{ marginTop: 4, color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.6 }}>
                    Your hostel has been approved.
                    <br />
                    Activation is pending.
                  </div>
                </div>
              </div>
            ) : statusData.status === "rejected" ? (
              <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-slate-900/40">
                <button
                  type="button"
                  className="btn-primary w-full flex items-center justify-center gap-2 rounded-3xl px-5 py-3 text-sm font-semibold"
                  onClick={() => navigate("/register")}
                >
                  Submit New Request
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div style={{ height: 110 }} />
    </div>
  );
}


function CardLine({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">{label}</div>
      <div className="mt-2 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

export default RequestStatus;

