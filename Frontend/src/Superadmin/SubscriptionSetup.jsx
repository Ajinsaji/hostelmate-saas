import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import SuperadminBottomNav from "../components/SuperadminBottomNav";
import buildFileUrl from "../utils/buildFileUrl";

import { CheckCircle2, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

import { api } from "../services/api";

function toISODateInputValue(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function SubscriptionSetup() {
  console.log("SUBSCRIPTION SETUP COMPONENT MOUNTED");
  const navigate = useNavigate();
  const { hostelId } = useParams();
  console.log("hostelId param:", hostelId);

  const [loading, setLoading] = useState(false);
  const [hostel, setHostel] = useState(null);
  const [form, setForm] = useState({
    planType: "Trial",
    amount: "",
    startDate: "",
    endDate: "",
    isTrial: true,
    isFreeAccess: false,
    notes: "",
  });

  const parsedPlanType = useMemo(() => {
    // Backend Subscription.planType supports Basic/Pro
    // Frontend requirement uses Trial/Monthly/Yearly label.
    // Map: Trial->Basic, Monthly/Yearly->Pro for now (safe placeholder).
    if (form.planType === "Trial") return "Basic";
    if (form.planType === "Monthly") return "Pro";
    if (form.planType === "Yearly") return "Pro";
    return "Basic";
  }, [form.planType]);

  useEffect(() => {
    console.log("SUBSCRIPTION SETUP PAGE LOADED", hostelId);
    if (!hostelId) {
      console.warn("hostelId is undefined in useEffect");
      return;
    }
    // Minimal placeholder: we don't yet have a dedicated hostel details endpoint for drafts.
    // So we at least initialize a reasonable date range.
    const now = new Date();
    const end = new Date(now);
    end.setDate(now.getDate() + 30);

    setForm((prev) => ({
      ...prev,
      startDate: prev.startDate || toISODateInputValue(now),
      endDate: prev.endDate || toISODateInputValue(end),
    }));

    // Optional: try to read hostel info if backend returns it from an existing hostels list.
    // If it fails, UI still works and submits values.
    (async () => {
      try {
        const res = await api.get("/api/admin/hostels");
        const found = (res.data?.hostels || []).find((h) => String(h.hostelId || h._id) === String(hostelId));
        if (found) {
          setHostel(found);
        }
      } catch {
        // ignore
      }
    })();
  }, [hostelId]);

  const submitFinalize = async (e) => {
    e.preventDefault();
    console.log("Finalize button clicked", hostelId);

    if (!hostelId) {
      toast.error("Hostel ID missing");
      return;
    }

    const amountNumber = form.amount === "" ? 0 : Number(form.amount);
    if (Number.isNaN(amountNumber)) {
      toast.error("Amount must be a number");
      return;
    }

    if (!form.startDate || !form.endDate) {
      toast.error("Start Date and End Date are required");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/admin/finalize-hostel-activation/${encodeURIComponent(hostelId)}`, {
        planType: parsedPlanType,
        amount: amountNumber,
        startDate: form.startDate,
        endDate: form.endDate,
        isTrial: !!form.isTrial,
        isFreeAccess: !!form.isFreeAccess,
        notes: form.notes || "",
      });

      toast.success("Activation submitted");
      // Do not navigate to credentials/activation success yet.
      // Final activation will be wired after finalize logic is implemented.
      navigate("/admin/pending-requests");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to activate hostel");
    } finally {
      setLoading(false);
    }
  };

  const qrPreviewSrc = hostel?.qrCodeUrl || hostel?.qrCode || "";

  if (!hostelId) {
    return (
      <div style={{ minHeight: "100vh", background: "#081028", paddingBottom: "110px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ color: "white", fontSize: "18px" }}>Missing hostelId parameter</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#081028", paddingBottom: "110px" }}>
      <div
        className="gradient-header mb-6"
        style={{ paddingBottom: "40px", borderBottomLeftRadius: "30px", borderBottomRightRadius: "30px" }}
      >
        <h1 className="text-h1" style={{ color: "white" }}>
          Subscription Setup
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)" }}>
          Configure subscription before activating this hostel.
        </p>
      </div>

      <div className="p-4" style={{ marginTop: "-30px" }}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 16,
          }}
        >
          {/* HOSTEL INFO */}
          <div
            className="glass-card rounded-2xl p-5 shadow-sm"
            style={{ background: "rgba(11,23,57,0.45)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 className="text-h3" style={{ color: "var(--text-main)", marginBottom: 6 }}>
                  {hostel?.hostelName || "Hostel"}
                </h2>

                <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                  <AlertTriangle size={16} style={{ color: "#f59e0b" }} />
                  <span
                    className="text-xs"
                    style={{
                      background: "rgba(245,158,11,0.15)",
                      color: "#fbbf24",
                      border: "1px solid rgba(245,158,11,0.25)",
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontWeight: 800,
                    }}
                  >
                    Pending Activation
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div className="text-small text-muted" style={{ marginBottom: 4 }}>
                  Hostel ID
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>
                  {hostelId}
                </div>
              </div>
            </div>

            <div className="text-small text-muted" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Owner</div>
                <div style={{ fontWeight: 800, color: "rgba(255,255,255,0.92)" }}>
                  {hostel?.owner?.name || hostel?.ownerName || "-"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Phone</div>
                <div style={{ fontWeight: 800, color: "rgba(255,255,255,0.92)" }}>
                  {hostel?.phone || "-"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Hostel Type</div>
                <div style={{ fontWeight: 800, color: "rgba(255,255,255,0.92)" }}>
                  {hostel?.hostelType || "-"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>State/District</div>
                <div style={{ fontWeight: 800, color: "rgba(255,255,255,0.92)" }}>
                  {hostel?.state || "-"} / {hostel?.district || "-"}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 10, color: "rgba(255,255,255,0.9)" }}>
                QR Preview
              </div>
              {qrPreviewSrc ? (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <img
                    src={buildFileUrl(qrPreviewSrc)}
                    alt="QR Code"
                    style={{ width: 160, height: 160, borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)" }}
                  />
                </div>
              ) : (
                <div className="text-small" style={{ color: "rgba(255,255,255,0.65)", textAlign: "center" }}>
                  QR not available yet.
                </div>
              )}
            </div>
          </div>

          {/* SUBSCRIPTION FORM */}
          <div
            className="glass-card rounded-2xl p-5 shadow-sm"
            style={{ background: "rgba(11,23,57,0.45)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.95)", fontSize: 16 }}>
                  Subscription
                </div>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>
                  Configure plan before activation.
                </div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(37,211,102,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                <ShieldCheck size={18} />
              </div>
            </div>

            <form onSubmit={submitFinalize} className="flex flex-col gap-4">
              <div className="input-group">
                <span className="input-label">Plan Type</span>
                <select
                  className="input-field"
                  value={form.planType}
                  onChange={(e) => {
                    const val = e.target.value;
                    const isTrialNow = val === "Trial";
                    setForm((prev) => ({ ...prev, planType: val, isTrial: isTrialNow }));
                  }}
                >
                  <option value="Trial">Trial</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="input-group">
                  <span className="input-label">Amount</span>
                  <input
                    className="input-field"
                    type="number"
                    value={form.amount}
                    placeholder="0"
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                <div className="input-group">
                  <span className="input-label">Trial</span>
                  <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form.isTrial}
                      onChange={(e) => setForm((prev) => ({ ...prev, isTrial: e.target.checked }))}
                      style={{ width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>
                      {form.isTrial ? "Yes" : "No"}
                    </span>
                  </label>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="input-group">
                  <span className="input-label">Start Date</span>
                  <input
                    className="input-field"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <span className="input-label">End Date</span>
                  <input
                    className="input-field"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="input-group">
                <span className="input-label">Free Access</span>
                <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isFreeAccess}
                    onChange={(e) => setForm((prev) => ({ ...prev, isFreeAccess: e.target.checked }))}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>
                    {form.isFreeAccess ? "Enabled" : "Disabled"}
                  </span>
                </label>
              </div>

              <div className="input-group">
                <span className="input-label">Notes (optional)</span>
                <textarea
                  className="input-field"
                  value={form.notes}
                  placeholder="Add internal notes for this activation..."
                  rows={4}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ marginTop: 6 }}
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 size={16} className="animate-spin" />
                    Activating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <CheckCircle2 size={16} />
                    Activate Hostel
                  </span>
                )}
              </button>

              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 1.5 }}>
                Activation finalization will be handled in the backend finalize endpoint.
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6" style={{ textAlign: "center", color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
          Tip: If QR preview is missing, it will still be generated during draft approval.
        </div>
      </div>

      <SuperadminBottomNav />
    </div>
  );
}

export default SubscriptionSetup;

