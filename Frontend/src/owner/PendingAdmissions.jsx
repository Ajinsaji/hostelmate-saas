import { useTheme } from "../design-system/ThemeProvider";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";
import { EmptyState } from "../design-system/components/EmptyState";
import { useEffect, useState, useMemo } from "react";
import { api } from "../services/api";
import buildFileUrl from "../utils/buildFileUrl";
import {
  CheckCircle,
  XCircle,
  Search,
  UserRound,
  Eye,
  MapPin,
  Mail,
  Home,
  BadgeCheck,
  X,
  AlertTriangle,
  Calendar,
  Phone
} from "lucide-react";
import toast from "react-hot-toast";
import { usePendingAdmissions } from "../contexts/HostelContext";

function isTodayIST(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const dateIST = new Date(date.getTime() + istOffsetMs);
  const nowIST = new Date(now.getTime() + istOffsetMs);
  return (
    dateIST.getUTCFullYear() === nowIST.getUTCFullYear() &&
    dateIST.getUTCMonth() === nowIST.getUTCMonth() &&
    dateIST.getUTCDate() === nowIST.getUTCDate()
  );
}

function PendingAdmissions() {
  const { colors } = useTheme();
  const { updatePendingAdmissionsCount } = usePendingAdmissions();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState(null);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [confirmApproveItem, setConfirmApproveItem] = useState(null);
  const [confirmRejectItem, setConfirmRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/owner/admissions");
      const list = response.data.admissions || [];
      setAdmissions(list);
      const pending = list.filter((a) => a.status === "Pending").length;
      updatePendingAdmissionsCount(pending);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load admissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const counts = useMemo(() => {
    const pending = admissions.filter((a) => a.status === "Pending").length;
    const today = admissions.filter((a) => isTodayIST(a.createdAt)).length;
    const approved = admissions.filter((a) => a.status === "Approved").length;
    const rejected = admissions.filter((a) => a.status === "Rejected").length;
    return { pending, today, approved, rejected, all: admissions.length };
  }, [admissions]);

  const handleApprove = async (item) => {
    if (!navigator.onLine) {
      toast.error("You are currently offline. Please check your internet connection.");
      return;
    }
    const id = item._id;
    setLoadingActionId(id);
    try {
      const res = await api.put(`/api/owner/admissions/${id}/approve`);
      if (res.data?.success) {
        toast.success(res.data?.message || "Admission approved & resident created!");
      } else {
        toast.error(res.data?.message || "Failed to approve admission.");
      }
      setConfirmApproveItem(null);
      await fetchAdmissions();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to approve admission.");
      await fetchAdmissions();
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleReject = async (item) => {
    if (!navigator.onLine) {
      toast.error("You are currently offline. Please check your internet connection.");
      return;
    }
    const id = item._id;
    setLoadingActionId(id);
    try {
      const res = await api.put(`/api/owner/admissions/${id}/reject`, { reason: rejectReason });
      if (res.data?.success) {
        toast.success(res.data?.message || "Admission rejected.");
      } else {
        toast.error(res.data?.message || "Failed to reject admission.");
      }
      setConfirmRejectItem(null);
      setRejectReason("");
      await fetchAdmissions();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to reject admission.");
      await fetchAdmissions();
    } finally {
      setLoadingActionId(null);
    }
  };

  const filteredAdmissions = useMemo(() => {
    return admissions.filter((item) => {
      // 1. Tab filter
      if (activeTab === "pending" && item.status !== "Pending") return false;
      if (activeTab === "today" && !isTodayIST(item.createdAt)) return false;
      if (activeTab === "approved" && item.status !== "Approved") return false;
      if (activeTab === "rejected" && item.status !== "Rejected") return false;

      // 2. Query filter
      const keyword = query.trim().toLowerCase();
      if (!keyword) return true;
      return [
        item.residentName,
        item.phone,
        item.email,
        item.roomPreference,
        item.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [admissions, activeTab, query]);

  const openDetail = (item) => setSelectedAdmission(item);
  const closeDetail = () => setSelectedAdmission(null);

  const tabs = [
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "today", label: "Today's New", count: counts.today },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
    { key: "all", label: "All Records", count: counts.all },
  ];

  return (
    <PageContainer
      title="Admissions & Applicants"
      subtitle="Review admission requests, allocate rooms, and admit residents"
      action={
        <StatusPill tone={counts.pending > 0 ? "warning" : "success"}>
          {counts.pending > 0 ? `${counts.pending} Pending Review` : "All Caught Up"}
        </StatusPill>
      }
    >
      {/* Tabs & Search Card */}
      <Card>
        <div className="flex flex-col gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b pb-3" style={{ borderColor: colors.border.default }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    background: isActive ? colors.accent.primary : "rgba(255,255,255,0.05)",
                    color: isActive ? "#031018" : colors.text.primary,
                    border: `1px solid ${isActive ? colors.accent.primary : colors.border.default}`,
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      background: isActive ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.1)",
                      color: isActive ? "#031018" : colors.text.muted,
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 rounded-[16px] border px-3 py-2" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
            <Search size={16} style={{ color: colors.text.muted }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search applicants by name, phone, email, or room..."
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: colors.text.primary }}
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-xs text-slate-400 hover:text-white">
                Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Content */}
      {loading ? (
        <Card className="text-center py-10">
          <p className="text-sm font-medium" style={{ color: colors.text.muted }}>Loading admissions data...</p>
        </Card>
      ) : filteredAdmissions.length === 0 ? (
        <EmptyState
          title={
            activeTab === "pending"
              ? "No pending admissions"
              : activeTab === "today"
              ? "No new admissions received today"
              : activeTab === "approved"
              ? "No approved admissions found"
              : activeTab === "rejected"
              ? "No rejected admissions found"
              : "No admission records found"
          }
          message={
            activeTab === "pending"
              ? "You are all caught up! When prospective residents apply through your public link or QR code, they will appear here."
              : "Try switching tabs or adjusting your search filters."
          }
          action={
            <button
              onClick={() => fetchAdmissions()}
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: colors.accent.primary, color: "#031018" }}
            >
              Refresh
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredAdmissions.map((item) => {
            const isPending = item.status === "Pending";
            const isApproved = item.status === "Approved";
            const isRejected = item.status === "Rejected";

            return (
              <Card key={item._id} hover>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                      style={{
                        background: isApproved
                          ? "rgba(16,185,129,0.16)"
                          : isRejected
                          ? "rgba(239,68,68,0.16)"
                          : `${colors.accent.primary}16`,
                        color: isApproved
                          ? "#10B981"
                          : isRejected
                          ? "#EF4444"
                          : colors.accent.primary,
                      }}
                    >
                      <UserRound size={20} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-white">{item.residentName}</h3>
                        <StatusPill
                          tone={
                            isApproved
                              ? "success"
                              : isRejected
                              ? "danger"
                              : "warning"
                          }
                        >
                          {item.status || "Pending"}
                        </StatusPill>
                        {isTodayIST(item.createdAt) && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                            New Today
                          </span>
                        )}
                      </div>

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: colors.text.muted }}>
                        <div className="flex items-center gap-1.5">
                          <Phone size={13} />
                          <span>{item.phone || "—"}</span>
                        </div>
                        {item.email && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail size={13} />
                            <span className="truncate">{item.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Home size={13} />
                          <span>Room Preference: {item.roomPreference || item.preferredRoom || "Any Room"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          <span>Applied: {new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Documents snippet */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.idProofFile && (
                          <a
                            href={buildFileUrl(item.idProofFile)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md px-2 py-0.5 text-[11px] font-medium underline"
                            style={{ background: "rgba(255,255,255,0.05)", color: colors.accent.info }}
                          >
                            ID Proof
                          </a>
                        )}
                        {item.photoFile && (
                          <a
                            href={buildFileUrl(item.photoFile)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md px-2 py-0.5 text-[11px] font-medium underline"
                            style={{ background: "rgba(255,255,255,0.05)", color: colors.accent.info }}
                          >
                            Photo
                          </a>
                        )}
                        {(item.signatureFile || item.signatureImage) && (
                          <a
                            href={buildFileUrl(item.signatureFile || item.signatureImage)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md px-2 py-0.5 text-[11px] font-medium underline"
                            style={{ background: "rgba(255,255,255,0.05)", color: colors.accent.info }}
                          >
                            Signature
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => openDetail(item)}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                      style={{ background: "rgba(255,255,255,0.05)", color: colors.text.primary }}
                    >
                      <Eye size={14} /> View Form
                    </button>

                    {isPending && (
                      <>
                        <button
                          disabled={loadingActionId === item._id}
                          onClick={() => setConfirmApproveItem(item)}
                          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
                          style={{
                            background: colors.accent.primary,
                            color: "#031018",
                            opacity: loadingActionId === item._id ? 0.6 : 1,
                          }}
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          disabled={loadingActionId === item._id}
                          onClick={() => setConfirmRejectItem(item)}
                          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
                          style={{
                            background: "rgba(239,68,68,0.14)",
                            color: colors.accent.danger,
                            opacity: loadingActionId === item._id ? 0.6 : 1,
                          }}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Form Modal */}
      {selectedAdmission && (
        <div
          onClick={closeDetail}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-3 sm:items-center"
          style={{ backdropFilter: "blur(6px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-[28px] border p-5 max-h-[90vh] overflow-y-auto"
            style={{ background: "rgba(13,27,42,0.98)", borderColor: colors.border.default }}
          >
            <div className="flex items-start justify-between gap-3 border-b pb-3" style={{ borderColor: colors.border.default }}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: colors.accent.primary }}>
                  Admission Application
                </p>
                <h3 className="mt-1 text-xl font-bold text-white">{selectedAdmission.residentName}</h3>
                <p className="text-xs text-slate-400">
                  Applied on {new Date(selectedAdmission.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={closeDetail}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-white"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Card className="p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Phone size={13} /> Contact Details
                </div>
                <p className="mt-2 font-semibold text-white">{selectedAdmission.phone || "—"}</p>
                <p className="mt-1 text-xs text-slate-400">{selectedAdmission.email || "No email provided"}</p>
                {selectedAdmission.emergencyContact && (
                  <p className="mt-1 text-xs text-slate-400">Emergency: {selectedAdmission.emergencyContact}</p>
                )}
              </Card>

              <Card className="p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Home size={13} /> Room & Status
                </div>
                <p className="mt-2 font-semibold text-white">
                  {selectedAdmission.roomPreference || selectedAdmission.preferredRoom || "Any Room"}
                </p>
                <div className="mt-2">
                  <StatusPill tone={selectedAdmission.status === "Approved" ? "success" : selectedAdmission.status === "Rejected" ? "danger" : "warning"}>
                    {selectedAdmission.status || "Pending"}
                  </StatusPill>
                </div>
              </Card>
            </div>

            <Card className="mt-3 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <MapPin size={13} /> Permanent Address
              </div>
              <p className="mt-2 whitespace-pre-wrap text-xs text-slate-300">
                {selectedAdmission.address || "No address provided"}
              </p>
            </Card>

            <Card className="mt-3 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <BadgeCheck size={13} /> Documents & Agreement
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedAdmission.idProofFile && (
                  <a
                    href={buildFileUrl(selectedAdmission.idProofFile)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border px-3 py-1 text-xs font-semibold underline"
                    style={{ borderColor: colors.border.default, color: colors.accent.info }}
                  >
                    View ID Proof Document
                  </a>
                )}
                {selectedAdmission.photoFile && (
                  <a
                    href={buildFileUrl(selectedAdmission.photoFile)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border px-3 py-1 text-xs font-semibold underline"
                    style={{ borderColor: colors.border.default, color: colors.accent.info }}
                  >
                    View Photo
                  </a>
                )}
                {(selectedAdmission.signatureFile || selectedAdmission.signatureImage) && (
                  <a
                    href={buildFileUrl(selectedAdmission.signatureFile || selectedAdmission.signatureImage)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border px-3 py-1 text-xs font-semibold underline"
                    style={{ borderColor: colors.border.default, color: colors.accent.info }}
                  >
                    View Signature
                  </a>
                )}
              </div>
              <div className="mt-3 pt-3 border-t text-xs text-slate-400" style={{ borderColor: colors.border.default }}>
                <p>Rules Agreement Checked: <span className="text-white font-medium">{selectedAdmission.agreementChecked ? "Yes" : "No"}</span></p>
                {selectedAdmission.signedAt && (
                  <p className="mt-1">Signed Timestamp: {new Date(selectedAdmission.signedAt).toLocaleString()}</p>
                )}
              </div>
            </Card>

            {selectedAdmission.status === "Pending" && (
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    const item = selectedAdmission;
                    closeDetail();
                    setConfirmRejectItem(item);
                  }}
                  className="rounded-full px-4 py-2 text-xs font-semibold"
                  style={{ background: "rgba(239,68,68,0.14)", color: colors.accent.danger }}
                >
                  Reject Request
                </button>
                <button
                  onClick={() => {
                    const item = selectedAdmission;
                    closeDetail();
                    setConfirmApproveItem(item);
                  }}
                  className="rounded-full px-4 py-2 text-xs font-semibold"
                  style={{ background: colors.accent.primary, color: "#031018" }}
                >
                  Approve & Admit Resident
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal: Approve */}
      {confirmApproveItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" style={{ backdropFilter: "blur(6px)" }}>
          <div
            className="w-full max-w-md rounded-[24px] border p-5"
            style={{ background: "rgba(13,27,42,0.98)", borderColor: colors.border.default }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Approve Admission</h3>
                <p className="text-xs text-slate-400">Create active resident record</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border p-3 bg-white/5 space-y-1 text-xs" style={{ borderColor: colors.border.default }}>
              <p><span className="text-slate-400">Applicant:</span> <span className="font-semibold text-white">{confirmApproveItem.residentName}</span></p>
              <p><span className="text-slate-400">Phone:</span> <span className="text-white">{confirmApproveItem.phone}</span></p>
              <p><span className="text-slate-400">Preferred Room:</span> <span className="text-white">{confirmApproveItem.roomPreference || confirmApproveItem.preferredRoom || "First Available"}</span></p>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Approving will automatically create an active resident profile, allocate an available bed in the room, and update hostel occupancy.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmApproveItem(null)}
                disabled={loadingActionId === confirmApproveItem._id}
                className="rounded-full px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(confirmApproveItem)}
                disabled={loadingActionId === confirmApproveItem._id}
                className="rounded-full px-4 py-2 text-xs font-semibold"
                style={{ background: colors.accent.primary, color: "#031018" }}
              >
                {loadingActionId === confirmApproveItem._id ? "Approving..." : "Confirm & Admit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reject */}
      {confirmRejectItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" style={{ backdropFilter: "blur(6px)" }}>
          <div
            className="w-full max-w-md rounded-[24px] border p-5"
            style={{ background: "rgba(13,27,42,0.98)", borderColor: colors.border.default }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Admission Request</h3>
                <p className="text-xs text-slate-400">Decline this applicant</p>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-300">
              Are you sure you want to decline the admission request for <strong className="text-white">{confirmRejectItem.residentName}</strong>?
            </p>

            <div className="mt-3 space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Rejection Reason (Optional)
              </label>
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. No vacancy in requested room"
                className="w-full rounded-xl border bg-[#0B1220] px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                style={{ borderColor: colors.border.default }}
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setConfirmRejectItem(null);
                  setRejectReason("");
                }}
                disabled={loadingActionId === confirmRejectItem._id}
                className="rounded-full px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(confirmRejectItem)}
                disabled={loadingActionId === confirmRejectItem._id}
                className="rounded-full px-4 py-2 text-xs font-semibold bg-red-500 text-white hover:bg-red-600"
              >
                {loadingActionId === confirmRejectItem._id ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default PendingAdmissions;
