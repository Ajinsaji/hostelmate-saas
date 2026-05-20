import { useEffect, useMemo, useRef, useState } from "react";
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
  const navigate = useNavigate();
  const { hostelId } = useParams();
  const submitLockRef = useRef(false);

  const now = new Date();
  const defaultStartDate = toISODateInputValue(now);
  const defaultEndDate = toISODateInputValue(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));

  const [loading, setLoading] = useState(false);
  const [hostel, setHostel] = useState(null);
  const [form, setForm] = useState({
    planType: "Trial",
    amount: "",
    startDate: defaultStartDate,
    endDate: defaultEndDate,
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
    if (!hostelId) {
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/api/admin/hostels");
        const found = (res.data?.hostels || []).find((h) => String(h.hostelId || h._id) === String(hostelId));
        if (mounted && found) {
          setHostel(found);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [hostelId]);

  const submitFinalize = async (e) => {
    e.preventDefault();

    if (loading || submitLockRef.current) {
      return;
    }

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

    submitLockRef.current = true;
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
      navigate("/admin/pending-requests");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to activate hostel");
    } finally {
      submitLockRef.current = false;
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
    <div
      style={{ minHeight: "100vh", background: "#081028" }}
      className="overflow-x-hidden"
    >
      <div
        className="gradient-header mb-6 rounded-[32px] border border-white/10 bg-white/5 px-5 py-7 shadow-2xl shadow-slate-900/40"
        style={{ paddingBottom: "36px" }}
      >
        <h1 className="text-h1" style={{ color: "white" }}>
          Subscription Setup
        </h1>
        <p style={{ color: "rgba(255,255,255,0.88)", maxWidth: 680, lineHeight: 1.7 }}>
          Configure the subscription details clearly before activating this hostel. Use the fields below to select plan, dates, and access options.
        </p>
      </div>

      <div className="p-4" style={{ marginTop: 0, paddingBottom: 40 }}>
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-slate-900/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Hostel details</h2>
                <p className="mt-1 text-sm text-slate-300">Review the draft hostel and owner details before finalizing activation.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/75 px-4 py-3 text-sm font-semibold text-white shadow-sm">
                Pending activation
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <CardField label="Hostel name" value={hostel?.hostelName || "-"} />
              <CardField label="Owner" value={hostel?.owner?.name || hostel?.ownerName || "-"} />
              <CardField label="Phone" value={hostel?.phone || "-"} />
              <CardField label="Type" value={hostel?.hostelType || "-"} />
              <CardField label="State / District" value={`${hostel?.state || "-"} / ${hostel?.district || "-"}`} />
              <CardField label="Hostel ID" value={hostelId} />
            </div>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-slate-900/40 p-4">
              <div className="text-sm font-semibold text-white/80">QR Preview</div>
              <div className="mt-4 flex items-center justify-center">
                {qrPreviewSrc ? (
                  <img
                    src={buildFileUrl(qrPreviewSrc)}
                    alt="QR Code"
                    className="h-44 w-44 max-w-full rounded-3xl border border-white/10 object-contain"
                  />
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-10 text-sm text-white/60">
                    QR not available yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-slate-950/90 p-6 shadow-2xl shadow-slate-900/40">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Subscription</h2>
                <p className="mt-1 text-sm text-slate-300">Set the plan, dates, and access controls for activation.</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-300">
                <ShieldCheck size={20} />
              </div>
            </div>

            <form onSubmit={submitFinalize} className="mt-6 flex flex-col gap-5">
              <FieldRow label="Plan Type">
                <select
                  className="input-field w-full"
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
              </FieldRow>

              <div className="grid gap-4 sm:grid-cols-2">
                <FieldRow label="Amount">
                  <input
                    className="input-field w-full"
                    type="number"
                    value={form.amount}
                    placeholder="0"
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                </FieldRow>
                <FieldRow label="Trial">
                  <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white/90">
                    <input
                      type="checkbox"
                      checked={form.isTrial}
                      onChange={(e) => setForm((prev) => ({ ...prev, isTrial: e.target.checked }))}
                      className="h-5 w-5 rounded border border-white/10 bg-slate-950"
                    />
                    <span>{form.isTrial ? "Yes" : "No"}</span>
                  </label>
                </FieldRow>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FieldRow label="Start Date">
                  <input
                    className="input-field w-full"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </FieldRow>
                <FieldRow label="End Date">
                  <input
                    className="input-field w-full"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </FieldRow>
              </div>

              <FieldRow label="Free Access">
                <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white/90">
                  <input
                    type="checkbox"
                    checked={form.isFreeAccess}
                    onChange={(e) => setForm((prev) => ({ ...prev, isFreeAccess: e.target.checked }))}
                    className="h-5 w-5 rounded border border-white/10 bg-slate-950"
                  />
                  <span>{form.isFreeAccess ? "Enabled" : "Disabled"}</span>
                </label>
              </FieldRow>

              <FieldRow label="Notes (optional)">
                <textarea
                  className="input-field min-h-[124px] w-full resize-none"
                  value={form.notes}
                  placeholder="Add internal notes for this activation..."
                  rows={4}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </FieldRow>

              <button
                type="submit"
                className="btn-primary mt-2 flex items-center justify-center gap-2 rounded-3xl px-5 py-3 text-sm font-semibold"
                disabled={loading}
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

              <div className="rounded-3xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                Activation finalization will be handled in the backend finalize endpoint.
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-400">
          Tip: If QR preview is missing, it will still be generated during draft approval.
        </div>
      </div>

      <div style={{ height: 110 }} />
      <SuperadminBottomNav />
    </div>
  );
}

function CardField({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">{label}</div>
      <div className="mt-2 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">{label}</div>
      {children}
    </div>
  );
}

export default SubscriptionSetup;

