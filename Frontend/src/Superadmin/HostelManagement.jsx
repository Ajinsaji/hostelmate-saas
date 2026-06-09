import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";
import useGlobalPolling from "../hooks/useGlobalPolling";
import {
  Copy,
  Download,
  Share2,
  Search,
  Building,
  User,
  Phone,
  ShieldAlert,
  Key,
  MessageCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";

import SuperadminBottomNav from "../components/SuperadminBottomNav";
import toast from "react-hot-toast";

import buildQrUrl from "../utils/buildQrUrl";
import buildFileUrl from "../utils/buildFileUrl";
import HostelEditModal from "./HostelEditModal";

function HostelManagement() {
  const [hostels, setHostels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditSaving, setIsEditSaving] = useState(false);

  const normalizeHostel = (raw) => {
    const subscriptionStatusRaw = raw?.subscriptionStatus ?? raw?.planStatus ?? raw?.status;
    const subscriptionStatus = typeof subscriptionStatusRaw === "string" ? subscriptionStatusRaw.toLowerCase() : "";

    const isTrial = !!raw?.isTrial || subscriptionStatus === "trial" || raw?.subscriptionType === "trial";

    const hostelId = raw?.hostelId || raw?._id || raw?.id || null;

    const phone = raw?.phone ?? raw?.owner?.phone ?? raw?.ownerPhone ?? raw?.mobile ?? "";

    const ownerName =
      raw?.ownerName ??
      raw?.owner?.name ??
      raw?.owner?.fullName ??
      raw?.owner?.username ??
      raw?.owner?.ownerName ??
      raw?.owner?.owner_id ??
      "";

    const publicUrl = raw?.publicUrl ?? raw?.publicLink ?? raw?.publicUrlPath ?? raw?.link ?? "";

    const qrCodeUrl = raw?.qrCodeUrl ?? raw?.qrUrl ?? raw?.qr ?? raw?.qrCode ?? "";

    const tempPassword = raw?.tempPassword ?? raw?.temporaryPassword ?? raw?.password ?? "";

    const occupancy = raw?.occupancy ?? {};
    const totalRooms = occupancy?.totalRooms ?? raw?.totalRooms ?? 0;
    const totalBeds = occupancy?.totalBeds ?? raw?.totalBeds ?? 0;
    const occupiedBeds = occupancy?.occupiedBeds ?? raw?.occupiedBeds ?? 0;
    const vacantBeds =
      occupancy?.vacantBeds ??
      raw?.vacantBeds ??
      (typeof totalBeds === "number" && typeof occupiedBeds === "number" ? totalBeds - occupiedBeds : 0);
    const activeResidents = occupancy?.activeResidents ?? raw?.activeResidents ?? 0;

    const approvalStatus = raw?.approvalStatus ?? raw?.approval ?? raw?.status ?? (raw?.isApproved ? "approved" : "pending") ?? "pending";

    const owner = raw?.owner;
    const ownerEmail = owner?.email ?? raw?.ownerEmail ?? raw?.email ?? "N/A";
    const ownerUsername = owner?.username ?? raw?.username ?? (phone || "N/A");

    const ownerId = raw?.ownerId ?? owner?._id ?? raw?.owner?._id;

    return {
      ...raw,
      hostelId,
      phone,
      ownerName,
      publicUrl,
      qrCodeUrl,
      tempPassword,
      subscriptionStatus: isTrial ? "trial" : subscriptionStatus || (raw?.subscriptionStatus ?? raw?.planStatus ?? "Unknown"),
      isTrial,
      occupancy: {
        totalRooms,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        activeResidents,
      },
      approvalStatus,
      ownerEmail,
      username: ownerUsername,
      owner: raw?.owner ?? owner,
    };
  };


  const [isResetting, setIsResetting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: null,
    ownerId: null,
    hostelName: "",
  });

  const fetchHostels = async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);

    try {
      const response = await api.get("/api/admin/hostels");
      setHostels((response.data.hostels || []).map(normalizeHostel));
    } catch (error) {

      if (!silent) {
        toast.error("Failed to load hostels");
      } else {
        console.warn("Hostel list refresh skipped or failed", error?.message || error);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const safeRefreshProps = {
    isEditing: !!selectedHostel,
    showModal: confirmModal.isOpen,
    isSubmitting: isResetting || isResending || isDeleting,
    isUploading: false,
    isTypingSearch: searchFocused,
  };

  useGlobalPolling(fetchHostels, { interval: 8000, safeProps: safeRefreshProps });

  const handleCopy = (text, type = "Copied") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${type} to clipboard!`);
  };

  const handleCopyAll = (h) => {
    const text = `Hostel: ${h.hostelName}\nLink: ${h.publicUrl}\nUsername: ${h.phone}\nPassword: ${h.tempPassword}`;
    handleCopy(text, "Credentials copied");
  };

  const handleResetPassword = (ownerId) => {
    setConfirmModal({
      isOpen: true,
      title: "Reset Password?",
      message: "Generate a new temporary password for this owner?",
      action: "reset",
      ownerId,
    });
  };

  const confirmResetPassword = async () => {
    const ownerId = confirmModal.ownerId;
    setConfirmModal({ isOpen: false, title: "", message: "", action: null, ownerId: null });
    setIsResetting(true);

    try {
      const res = await api.put(`/api/admin/hostels/${ownerId}/reset-password`);
      toast.success("New temporary password generated!");
      setHostels((prev) => prev.map((h) => (h.ownerId === ownerId ? { ...h, tempPassword: res.data.tempPassword } : h)));
      if (selectedHostel?.ownerId === ownerId) {
        setSelectedHostel((prev) => ({ ...prev, tempPassword: res.data.tempPassword }));
      }
    } catch (error) {
      toast.error("Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  const confirmDeleteHostel = async () => {
    const hostelId = confirmModal.ownerId;
    setConfirmModal({ isOpen: false, title: "", message: "", action: null, ownerId: null });
    setIsDeleting(true);

    try {
      await api.delete(`/api/admin/hostels/delete/${hostelId}`);
      toast.success("Hostel removed successfully");
      setHostels((prev) => prev.filter((h) => (h.hostelId || h._id) !== hostelId));
      if (selectedHostel && (selectedHostel.hostelId || selectedHostel._id) === hostelId) setSelectedHostel(null);
    } catch (error) {
      toast.error("Failed to delete hostel");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResendWhatsApp = async (ownerId) => {
    setIsResending(true);
    try {
      const res = await api.post(`/api/admin/hostels/${ownerId}/resend-whatsapp`);
      if (res.data.success && res.data.whatsappURL) {
        toast.success("Opening WhatsApp...");
        window.open(res.data.whatsappURL, "_blank");
      } else {
        toast.success("WhatsApp credentials ready!");
      }
    } catch (error) {
      toast.error("Failed to generate WhatsApp link");
    } finally {
      setIsResending(false);
    }
  };

  const filteredHostels = useMemo(() => {
    return hostels.filter((h) => {
      const matchesSearch =
        (h.hostelName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.phone || "").toString().includes(searchQuery);

      const subscriptionStatus = (h.subscriptionStatus || "").toLowerCase();

      let matchesFilter = true;
      if (filter === "active") matchesFilter = subscriptionStatus === "active";
      if (filter === "trial") matchesFilter = !!h.isTrial;
      if (filter === "expired") matchesFilter = subscriptionStatus === "expired";
      if (filter === "locked") matchesFilter = subscriptionStatus === "locked";

      return matchesSearch && matchesFilter;
    });
  }, [hostels, searchQuery, filter]);

  const selectedHostelQrUrl = selectedHostel?.qrCodeUrl ? buildQrUrl(selectedHostel.qrCodeUrl) : "";
  const selectedHostelOwnerImage = selectedHostel
    ? buildFileUrl(
        selectedHostel?.owner?.profileImage ||
        selectedHostel?.owner?.photo ||
        selectedHostel?.ownerPhoto ||
        selectedHostel?.ownerImage ||
        selectedHostel?.profileImage ||
        ""
      )
    : "";
  const selectedHostelOwnerEmail = selectedHostel?.owner?.email || selectedHostel?.ownerEmail || selectedHostel?.email || "N/A";
  const selectedHostelUsername = selectedHostel?.owner?.username || selectedHostel?.username || selectedHostel?.phone || "N/A";
  const selectedHostelType = selectedHostel?.hostelType || selectedHostel?.type || selectedHostel?.category || "N/A";
  const selectedHostelState = selectedHostel?.state || "N/A";
  const selectedHostelPlace = selectedHostel?.city || selectedHostel?.place || selectedHostel?.location || "N/A";
  const selectedHostelStatus = selectedHostel?.pendingActivation === true
    ? "activation_pending"
    : selectedHostel?.approvalStatus || selectedHostel?.status || (selectedHostel?.isApproved ? "approved" : "pending") || "Unknown";
  const selectedHostelSubscription = selectedHostel?.isTrial ? "trial" : selectedHostel?.subscriptionStatus || "Unknown";
  const selectedHostelCreatedDate = selectedHostel?.createdAt || selectedHostel?.createdOn || selectedHostel?.createdDate || "";
  const selectedHostelCreatedLabel = selectedHostelCreatedDate ? new Date(selectedHostelCreatedDate).toLocaleDateString() : "N/A";
  const selectedHostelOccupancy = selectedHostel?.occupancy || {};
  const selectedHostelTotalRooms = selectedHostelOccupancy.totalRooms ?? selectedHostel?.totalRooms ?? 0;
  const selectedHostelTotalBeds = selectedHostelOccupancy.totalBeds ?? selectedHostel?.totalBeds ?? 0;
  const selectedHostelOccupiedBeds = selectedHostelOccupancy.occupiedBeds ?? selectedHostel?.occupiedBeds ?? 0;
  const selectedHostelVacantBeds = selectedHostelOccupancy.vacantBeds ?? (typeof selectedHostelTotalBeds === "number" && typeof selectedHostelOccupiedBeds === "number" ? selectedHostelTotalBeds - selectedHostelOccupiedBeds : null);
  const selectedHostelActiveResidents = selectedHostelOccupancy.activeResidents ?? selectedHostel?.activeResidents ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "#081028", paddingBottom: "100px", fontFamily: "Poppins" }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="gradient-header mb-6" style={{ paddingBottom: "40px", borderBottomLeftRadius: "30px", borderBottomRightRadius: "30px" }}>
          <h1 className="text-h1" style={{ color: "white" }}>
            Hostel Management
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)" }}>Manage approved hostels & credentials</p>
        </div>

        <div style={{ marginTop: "-30px" }}>
        <div className="card" style={{ marginBottom: "24px" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={18}
              style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search hostel or owner phone..."
              className="w-full border-none rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", paddingLeft: "44px", fontSize: "14px" }}
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {[
              "all",
              "active",
              "trial",
              "expired",
              "locked",
            ].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
                style={{
                  background: filter === f ? "var(--primary)" : "rgba(255,255,255,0.04)",
                  color: filter === f ? "white" : "var(--text-muted)",
                  border: filter === f ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="text-center p-8 glass-card animate-pulse" style={{ background: "rgba(11,23,57,0.55)", borderColor: "rgba(255,255,255,0.08)" }}>
              Loading hostels...
            </div>
          ) : filteredHostels.length === 0 ? (
            <div className="text-center p-8 card" style={{ background: "var(--bg-2)" }}>
              No hostels found
            </div>
          ) : (
            filteredHostels.map((h) => (
              <div
                key={h.hostelId || h._id}
                className="glass-card p-5 rounded-2xl shadow-sm relative overflow-hidden"
                style={{ background: "rgba(11,23,57,0.45)" }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "6px",
                    height: "100%",
                    background:
                      h.isTrial
                        ? "#eab308"
                        : h.subscriptionStatus === "active"
                          ? "#22c55e"
                          : "#ef4444",
                  }}
                />

                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-h3" style={{ color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Building size={16} color="var(--primary)" /> {h.hostelName}
                    </h3>
                    <p className="text-xs text-muted mt-1 flex items-center gap-2 flex-wrap">
                      <User size={12} /> {h.ownerName}
                      <span style={{ opacity: 0.65 }}>•</span>
                      <a
                        href={`tel:${h.phone}`}
                        className="flex items-center gap-1"
                        style={{
                          color: "var(--primary-dark)",
                          fontWeight: 800,
                          textDecoration: "none",
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: "rgba(15, 93, 70, 0.08)",
                          border: "1px solid rgba(15, 93, 70, 0.12)",
                        }}
                      >
                        <Phone size={12} />
                        {h.phone}
                      </a>
                    </p>
                  </div>

                  <span
                    className="text-xs px-2 py-1 rounded-full font-bold"
                    style={{
                      background:
                        h.isTrial
                          ? "rgba(254,249,195,0.08)"
                          : h.subscriptionStatus === "active"
                            ? "rgba(220,252,231,0.08)"
                            : "rgba(254,226,226,0.08)",
                      color:
                        h.isTrial
                          ? "#854d0e"
                          : h.subscriptionStatus === "active"
                            ? "#166534"
                            : "#991b1b",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {h.isTrial ? "Trial" : h.subscriptionStatus}
                  </span>
                </div>

                <div
                  className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Occupancy</p>
                    <p className="text-sm font-semibold">
                      {h.occupancy?.occupiedBeds || 0} / {h.occupancy?.totalBeds || 0} Beds
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Public Link</p>
                    <button
                      type="button"
                      onClick={() => window.open(h.publicUrl, "_blank")}
                      className="text-xs"
                      style={{
                        color: "#22c55e",
                        opacity: 0.95,
                        textDecoration: "underline",
                        fontWeight: 800,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      View Page
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-1">
                  <a
                    href={`tel:${h.phone}`}
                    className="btn-icon"
                    style={{ width: "100%", height: 44, borderRadius: 14, background: "rgba(15, 93, 70, 0.08)", border: "1px solid rgba(15, 93, 70, 0.12)", color: "var(--primary-dark)" }}
                    aria-label="Call owner"
                  >
                    <Phone size={16} />
                  </a>

                  <a
                    href={`https://wa.me/91${String(h.phone || "").replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-icon"
                    style={{ width: "100%", height: 44, borderRadius: 14, background: "rgba(37, 211, 102, 0.10)", border: "1px solid rgba(37, 211, 102, 0.15)", color: "#25D366" }}
                    aria-label="WhatsApp owner"
                  >
                    <MessageCircle size={16} />
                  </a>

                  <button
                    type="button"
                    onClick={() => window.open(h.publicUrl, "_blank")}
                    className="btn-icon"
                    style={{ width: "100%", height: 44, borderRadius: 14, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.12)", color: "var(--primary-dark)" }}
                    aria-label="Open public link"
                  >
                    <Share2 size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedHostel(normalizeHostel(h))}
                    className="btn-icon"
                    style={{ width: "100%", height: 44, borderRadius: 14, background: "rgba(212, 175, 55, 0.10)", border: "1px solid rgba(212, 175, 55, 0.18)", color: "#D4AF37" }}
                    aria-label="View QR"
                  >
                    <Key size={16} />
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedHostel(normalizeHostel(h))}
                    className="flex-1"
                    style={{
                      background: "rgba(34,197,94,0.10)",
                      border: "1px solid rgba(34,197,94,0.22)",
                      color: "#22c55e",
                      padding: "14px 16px",
                      borderRadius: 16,
                      fontWeight: 900,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 10,
                      transition: "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
                      boxShadow: "0 18px 60px rgba(34,197,94,0.08)",
                    }}
                    aria-label="View credentials and QR"
                  >
                    <Key size={16} /> View Credentials & QR
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setConfirmModal({
                        isOpen: true,
                        title: "Remove Hostel",
                        message: `Remove "${h.hostelName}" permanently? This will delete related rooms, beds, residents, payments, and notifications.

This action cannot be undone.
`,
                        action: "deleteHostel",
                        ownerId: h.hostelId || h._id,
                        hostelName: h.hostelName || "hostel",
                      })
                    }
                    className="flex items-center justify-center gap-2"
                    style={{
                      flex: 1,
                      minWidth: 160,
                      padding: "14px 16px",
                      borderRadius: 16,
                      background: "rgba(239,68,68,0.10)",
                      border: "1px solid rgba(239,68,68,0.22)",
                      color: "#ef4444",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                    aria-label="Remove Hostel"
                  >
                    <Trash2 size={18} /> Remove Hostel
                  </button>

                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Hostel Details Modal */}
      {selectedHostel && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "18px",
          }}
        >
          <div
            className="animate-slide-up w-full max-w-[820px] max-h-[92vh] overflow-y-auto rounded-3xl p-5 md:p-6 shadow-2xl relative glass-card"
            style={{ background: "rgba(11,23,57,0.92)" }}
          >
            <button
              type="button"
              onClick={() => setSelectedHostel(null)}
              className="absolute top-4 right-4 p-3 rounded-full"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "#fff" }}
              aria-label="Close details modal"
            >
              <ShieldAlert size={18} />
            </button>

            <div className="flex flex-col gap-4 mb-4 text-white">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedHostel?.hostelId || selectedHostel?._id;
                    setIsEditOpen(true);
                  }}
                  className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
                  style={{
                    background: "rgba(212,175,55,0.10)",
                    border: "1px solid rgba(212,175,55,0.22)",
                    color: "#D4AF37",
                  }}
                >
                  ✏️ Edit Hostel
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">{selectedHostel.hostelName || "Hostel Details"}</h2>
                  <p className="text-sm text-muted mt-1">{selectedHostel.description || "No description provided."}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedHostel?.pendingActivation === true ? (
                    <span
                      className="px-3 py-1 rounded-full text-[11px] uppercase font-semibold"
                      style={{
                        background: "rgba(254,249,195,0.10)",
                        border: "1px solid rgba(234,179,8,0.25)",
                        color: "#854d0e",
                      }}
                    >
                      🟡 Activation Pending
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[11px] uppercase font-semibold" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff" }}>
                      Approval: {selectedHostelStatus}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full text-[11px] uppercase font-semibold" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff" }}>
                    Subscription: {selectedHostelSubscription}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[120px_minmax(0,1fr)] gap-4 items-center">
                <div className="w-full h-[120px] rounded-3xl overflow-hidden border" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)" }}>
                  {selectedHostelOwnerImage ? (
                    <img src={selectedHostelOwnerImage} alt="Owner" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.72)", fontSize: 14, fontWeight: 700 }}>
                      NO AVATAR
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted">Owner Name</p>
                    <p className="font-semibold">{selectedHostel.ownerName || selectedHostel?.owner?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted">Owner Email</p>
                    <p className="font-semibold">{selectedHostelOwnerEmail}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-muted">Phone</p>
                      <p className="font-semibold">{selectedHostel.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-muted">Username</p>
                      <p className="font-semibold">{selectedHostelUsername}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 mb-4">
              <div className="rounded-3xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[10px] uppercase tracking-[0.24em] text-muted mb-3">Hostel Information</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted">Type</span>
                    <span>{selectedHostelType}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted">State</span>
                    <span>{selectedHostelState}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted">District</span>
                    <span>{selectedHostel.district || "N/A"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted">City / Place</span>
                    <span>{selectedHostelPlace}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted">Pincode</span>
                    <span>{selectedHostel.pincode || "N/A"}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted">Created</span>
                    <span>{selectedHostelCreatedLabel}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[10px] uppercase tracking-[0.24em] text-muted mb-3">Address</p>
                <p className="text-sm leading-6">{selectedHostel.address || "No address provided."}</p>
                <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-muted">Description</p>
                <p className="text-sm leading-6">{selectedHostel.description || "No additional notes available."}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Total Rooms", value: selectedHostelTotalRooms },
                { label: "Total Beds", value: selectedHostelTotalBeds },
                { label: "Occupied Beds", value: selectedHostelOccupiedBeds },
                { label: "Vacant Beds", value: selectedHostelVacantBeds ?? "N/A" },
                { label: "Active Residents", value: selectedHostelActiveResidents },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-muted mb-2">{item.label}</p>
                  <p className="text-xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-6 rounded-3xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted mb-4">QR & Public Access</p>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 min-w-[150px] rounded-3xl p-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {selectedHostelQrUrl ? (
                    <img
                      src={selectedHostelQrUrl}
                      alt="Hostel QR"
                      style={{ width: "100%", minHeight: 180, objectFit: "contain", borderRadius: 18 }}
                    />
                  ) : (
                    <div style={{ width: "100%", minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.65)", fontSize: 13, textAlign: "center", padding: 14, lineHeight: 1.4 }}>
                      No QR generated yet
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-3 w-full">
                  <div className="rounded-3xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted mb-2">Public Hostel Link</p>
                    <p className="text-sm break-all">{selectedHostel.publicUrl || "Not available"}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => selectedHostel.publicUrl && window.open(selectedHostel.publicUrl, "_blank")}
                      disabled={!selectedHostel.publicUrl}
                      className="py-3 rounded-2xl text-sm font-semibold"
                      style={{ background: "rgba(37,211,102,0.12)", color: "#EFFFF8", border: "1px solid rgba(37,211,102,0.22)" }}
                    >
                      Open Public Page
                    </button>
                    <button
                      type="button"
                      onClick={() => selectedHostelQrUrl && window.open(selectedHostelQrUrl, "_blank")}
                      disabled={!selectedHostelQrUrl}
                      className="py-3 rounded-2xl text-sm font-semibold"
                      style={{ background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}
                    >
                      {selectedHostelQrUrl ? "View QR" : "No QR"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedHostelQrUrl) {
                          const link = document.createElement("a");
                          link.href = selectedHostelQrUrl;
                          link.download = `${selectedHostel.hostelName || "hostel"}-qr.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                      disabled={!selectedHostelQrUrl}
                      className="py-3 rounded-2xl text-sm font-semibold"
                      style={{ background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}
                    >
                      Download QR
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-4 mb-4 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)" }}>
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Username</p>
                <button type="button" onClick={() => handleCopy(selectedHostelUsername, "Username")} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: "#fff" }}>
                  <Copy size={12} />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-semibold" style={{ color: "#fff" }}>{selectedHostelUsername}</span>
                <a
                  href={`tel:${selectedHostel.phone}`}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-2xl"
                  style={{ background: "rgba(15, 93, 70, 0.08)", border: "1px solid rgba(15, 93, 70, 0.12)", color: "var(--primary-dark)", textDecoration: "none" }}
                >
                  <Phone size={14} />
                </a>
              </div>

              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Temporary Password</p>
                <button type="button" onClick={() => handleCopy(selectedHostel.tempPassword, "Password")} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: "#fff" }}>
                  <Copy size={12} />
                </button>
              </div>

              <p className="font-semibold" style={{ color: "#fff" }}>{selectedHostel.tempPassword || "N/A"}</p>
            </div>

            <div className="flex flex-col gap-3 mb-3">
              <button
                type="button"
                onClick={() => handleCopyAll(selectedHostel)}
                className="w-full py-3 rounded-xl font-medium text-sm flex justify-center items-center gap-2"
                style={{ background: "linear-gradient(135deg, rgba(15,93,70,1) 0%, rgba(15,122,94,1) 100%)", color: "#fff" }}
              >
                <Copy size={16} /> Copy All Credentials
              </button>
              <button
                type="button"
                disabled={isResending}
                onClick={() => handleResendWhatsApp(selectedHostel.ownerId)}
                className="w-full text-white py-3 rounded-xl font-medium text-sm flex justify-center items-center gap-2"
                style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.35), rgba(34,197,94,0.22))", opacity: isResending ? 0.7 : 1, border: "1px solid rgba(34,197,94,0.22)" }}
              >
                <MessageCircle size={16} /> Resend Credentials via WhatsApp
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={() => handleResetPassword(selectedHostel.ownerId)}
                className="w-full py-3 rounded-xl font-medium text-sm flex justify-center items-center gap-2"
                style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(239,68,68,0.10))", color: "#fff", opacity: isResetting ? 0.7 : 1, border: "1px solid rgba(245,158,11,0.28)" }}
              >
                {isResetting ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />} Generate New Temporary Password
              </button>
              <button
                type="button"
                onClick={() => setSelectedHostel(null)}
                className="w-full mt-1 py-3 rounded-xl font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Hostel Modal */}
      {isEditOpen && selectedHostel && (
        <HostelEditModal
          initialValues={{
            hostelName: selectedHostel.hostelName || "",
            hostelType: selectedHostel.hostelType || selectedHostel.type || selectedHostel.category || "",
            state: selectedHostel.state || "",
            district: selectedHostel.district || "",
            city: selectedHostel.city || selectedHostel.place || selectedHostel.location || "",
            pincode: selectedHostel.pincode || "",
            address: selectedHostel.address || "",
            description: selectedHostel.description || "",
          }}
          onClose={() => setIsEditOpen(false)}
          saving={isEditSaving}
          onSave={async (values) => {
            const id = selectedHostel?.hostelId || selectedHostel?._id;
            if (!id) return;

            try {
              setIsEditSaving(true);
              const payload = {
                hostelName: values.hostelName,
                hostelType: values.hostelType,
                state: values.state,
                district: values.district,
                city: values.city,
                pincode: values.pincode,
                address: values.address,
                description: values.description,
              };

              const res = await api.put(`/api/admin/hostels/edit/${id}`, payload);
              toast.success("Hostel updated successfully");

              const updated = res.data?.hostel || res.data?.data || res.data?.updatedHostel || res.data;

              setHostels((prev) => {
                return (prev || []).map((h) => {
                  const hid = h?.hostelId || h?._id;
                  if (String(hid) !== String(id)) return h;
                  return normalizeHostel(updated);
                });
              });

              setSelectedHostel((prev) => {
                if (!prev) return prev;
                return normalizeHostel({ ...prev, ...updated, hostelId: id });
              });

              setIsEditOpen(false);
            } catch (err) {
              toast.error(err?.response?.data?.message || "Failed to update hostel");
            } finally {
              setIsEditSaving(false);
            }
          }}
        />
      )}

      {/* Confirmation Modal */}
      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1001,
            padding: "20px",
          }}
        >
          <div className="glass-card rounded-2xl p-6 max-w-[350px] shadow-2xl" style={{ animation: "slideUp 0.3s ease-out", background: "rgba(11,23,57,0.78)" }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-main)" }}>{confirmModal.title}</h2>
            {confirmModal.hostelName && (
              <p className="text-small font-semibold" style={{ color: "rgba(255,255,255,0.88)", marginBottom: 10 }}>
                {confirmModal.hostelName}
              </p>
            )}
            <p className="text-small" style={{ color: "rgba(255,255,255,0.75)" }}>{confirmModal.message}</p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", action: null, ownerId: null })}
                className="flex-1 py-2 font-semibold rounded-lg"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => (confirmModal.action === "deleteHostel" ? confirmDeleteHostel() : confirmResetPassword())}
                disabled={confirmModal.action === "deleteHostel" ? isDeleting : isResetting}
                className="flex-1 py-2 font-semibold rounded-lg"
                style={{
                  background: confirmModal.action === "deleteHostel"
                    ? "linear-gradient(135deg, rgba(239,68,68,1) 0%, rgba(220,38,38,1) 100%)"
                    : "linear-gradient(135deg, rgba(15,93,70,1) 0%, rgba(15,122,94,1) 100%)",
                  color: "#fff",
                  opacity:
                    confirmModal.action === "deleteHostel"
                      ? isDeleting
                        ? 0.7
                        : 1
                      : isResetting
                        ? 0.7
                        : 1,
                  border: "none",
                  cursor:
                    confirmModal.action === "deleteHostel"
                      ? isDeleting
                        ? "not-allowed"
                        : "pointer"
                      : isResetting
                        ? "not-allowed"
                        : "pointer",
                }}
              >
                {confirmModal.action === "deleteHostel"
                  ? isDeleting
                    ? "Removing..."
                    : "Remove Hostel"
                  : isResetting
                    ? "Processing..."
                    : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SuperadminBottomNav />
      </div>
    </div>
  );
}

export default HostelManagement;

