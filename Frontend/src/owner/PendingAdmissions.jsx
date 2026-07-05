import { useEffect, useState } from "react";
import { api } from "../services/api";
import buildFileUrl from "../utils/buildFileUrl";
import { CheckCircle, XCircle, Search, Filter, Sparkles, UserRound, Eye, MapPin, Mail, Home, BadgeCheck, X } from "lucide-react";
import BottomNav from "../components/BottomNav";
import toast from "react-hot-toast";
import { PageShell, GlassCard, StatusPill, EmptyState, PREMIUM_THEME } from "./PremiumUI";

function PendingAdmissions() {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/owner/admissions");
      setAdmissions(response.data.admissions || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load pending admissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const handleApprove = async (id) => {
    setLoadingActionId(id);
    try {
      setAdmissions((prev) => prev.map((a) => (a._id === id ? { ...a, status: "Approved" } : a)));
      await api.put(`/api/owner/admissions/${id}/approve`);
      toast.success("Admission approved successfully.");
      await fetchAdmissions();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to approve admission.");
      await fetchAdmissions();
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleReject = async (id) => {
    setLoadingActionId(id);
    try {
      setAdmissions((prev) => prev.map((a) => (a._id === id ? { ...a, status: "Rejected" } : a)));
      await api.put(`/api/owner/admissions/${id}/reject`);
      toast.success("Admission rejected successfully.");
      await fetchAdmissions();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to reject admission.");
      await fetchAdmissions();
    } finally {
      setLoadingActionId(null);
    }
  };

  const filteredAdmissions = admissions.filter((item) => {
    const keyword = query.toLowerCase();
    if (!keyword) return true;
    return [item.residentName, item.phone, item.preferredRoom, item.status].filter(Boolean).join(" ").toLowerCase().includes(keyword);
  });

  const openDetail = (item) => setSelectedAdmission(item);
  const closeDetail = () => setSelectedAdmission(null);

  return (
    <PageShell title="Pending Admissions" subtitle="Review new requests with calm, focused actions" action={<StatusPill tone="warning">{admissions.length} pending</StatusPill>}>
      <GlassCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-[16px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
            <Search size={16} style={{ color: PREMIUM_THEME.muted }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or phone" className="w-full bg-transparent text-sm outline-none" style={{ color: PREMIUM_THEME.text }} />
          </div>
          <button className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)", color: PREMIUM_THEME.text }}>
            <Filter size={16} /> Filters
          </button>
        </div>
      </GlassCard>

      {loading ? (
        <GlassCard className="text-center">Loading admissions...</GlassCard>
      ) : filteredAdmissions.length === 0 ? (
        <EmptyState title="No pending admissions" message="You are all caught up for now." action={<button onClick={() => fetchAdmissions()} className="rounded-full px-4 py-2 text-sm font-semibold" style={{ background: PREMIUM_THEME.primary, color: "#031018" }}>Refresh</button>} />
      ) : (
        <div className="space-y-3">
          {filteredAdmissions.map((item) => (
            <GlassCard key={item._id} hover>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${PREMIUM_THEME.primary}16`, color: PREMIUM_THEME.primary }}>
                    <UserRound size={18} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{item.residentName}</h3>
                      <StatusPill tone={item.status === "Pending" ? "warning" : "success"}>{item.status || "Pending"}</StatusPill>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: PREMIUM_THEME.muted }}>Phone: {item.phone}</p>
                    <p className="text-sm" style={{ color: PREMIUM_THEME.muted }}>Preferred room: {item.preferredRoom || "—"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.idProofFile ? <a href={buildFileUrl(item.idProofFile)} target="_blank" className="text-sm underline" style={{ color: PREMIUM_THEME.accent }}>ID Proof</a> : null}
                      {item.photoFile ? <a href={buildFileUrl(item.photoFile)} target="_blank" className="text-sm underline" style={{ color: PREMIUM_THEME.accent }}>Photo</a> : null}
                      {item.signatureFile ? <a href={buildFileUrl(item.signatureFile)} target="_blank" className="text-sm underline" style={{ color: PREMIUM_THEME.accent }}>Signature</a> : null}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => openDetail(item)} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <Eye size={16} /> View Form
                  </button>
                  {item.status === "Pending" ? (
                    <>
                      <button disabled={loadingActionId === item._id} onClick={() => handleApprove(item._id)} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold" style={{ background: PREMIUM_THEME.primary, color: "#031018", opacity: loadingActionId === item._id ? 0.7 : 1 }}>
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button disabled={loadingActionId === item._id} onClick={() => handleReject(item._id)} className="rounded-full px-3 py-2 text-sm font-semibold" style={{ background: "rgba(235,87,87,0.14)", color: PREMIUM_THEME.danger }}>
                        <XCircle size={16} /> Reject
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
      {selectedAdmission ? (
        <div onClick={closeDetail} className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-3 sm:items-center" style={{ backdropFilter: "blur(6px)" }}>
          <div onClick={(event) => event.stopPropagation()} className="w-full max-w-2xl rounded-[28px] border p-4 sm:p-5" style={{ background: "rgba(13,27,42,0.96)", borderColor: PREMIUM_THEME.border }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.primary }}>Pending resident</p>
                <h3 className="mt-2 text-xl font-semibold">{selectedAdmission.residentName}</h3>
              </div>
              <button onClick={closeDetail} className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <GlassCard className="p-3">
                <div className="flex items-center gap-2 text-sm" style={{ color: PREMIUM_THEME.muted }}><Mail size={14} /> Contact</div>
                <p className="mt-2 font-semibold">{selectedAdmission.phone || "—"}</p>
                <p className="mt-1 text-sm" style={{ color: PREMIUM_THEME.muted }}>{selectedAdmission.email || "No email provided"}</p>
              </GlassCard>
              <GlassCard className="p-3">
                <div className="flex items-center gap-2 text-sm" style={{ color: PREMIUM_THEME.muted }}><Home size={14} /> Preference</div>
                <p className="mt-2 font-semibold">{selectedAdmission.preferredRoom || "No preference"}</p>
                <p className="mt-1 text-sm" style={{ color: PREMIUM_THEME.muted }}>Room preference captured from the admission form.</p>
              </GlassCard>
            </div>

            <GlassCard className="mt-3 p-3">
              <div className="flex items-center gap-2 text-sm" style={{ color: PREMIUM_THEME.muted }}><MapPin size={14} /> Address</div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{selectedAdmission.address || "No address provided"}</p>
            </GlassCard>

            <GlassCard className="mt-3 p-3">
              <div className="flex items-center gap-2 text-sm" style={{ color: PREMIUM_THEME.muted }}><BadgeCheck size={14} /> Documents & agreement</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedAdmission.idProofFile ? <a href={buildFileUrl(selectedAdmission.idProofFile)} target="_blank" rel="noreferrer" className="text-sm underline" style={{ color: PREMIUM_THEME.accent }}>ID Proof</a> : null}
                {selectedAdmission.photoFile ? <a href={buildFileUrl(selectedAdmission.photoFile)} target="_blank" rel="noreferrer" className="text-sm underline" style={{ color: PREMIUM_THEME.accent }}>Photo</a> : null}
                {selectedAdmission.signatureFile ? <a href={buildFileUrl(selectedAdmission.signatureFile)} target="_blank" rel="noreferrer" className="text-sm underline" style={{ color: PREMIUM_THEME.accent }}>Signature</a> : null}
              </div>
              <p className="mt-3 text-sm" style={{ color: PREMIUM_THEME.muted }}>
                Agreement checked: {selectedAdmission.agreementChecked ? "Yes" : "No"}
              </p>
            </GlassCard>
          </div>
        </div>
      ) : null}

      <BottomNav />
    </PageShell>
  );
}

export default PendingAdmissions;
