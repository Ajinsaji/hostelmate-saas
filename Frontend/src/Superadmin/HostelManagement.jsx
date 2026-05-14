import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

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
} from "lucide-react";

import SuperadminBottomNav from "../components/SuperadminBottomNav";
import toast from "react-hot-toast";

const buildQrUrl = (qrCodeUrl) => {
  if (!qrCodeUrl) return "";
  if (qrCodeUrl.startsWith("http://") || qrCodeUrl.startsWith("https://")) return qrCodeUrl;
  return `${import.meta.env.VITE_API_URL}/uploads/${qrCodeUrl}`;
};

function HostelManagement() {
  const [hostels, setHostels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedHostel, setSelectedHostel] = useState(null);

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
  });

  const fetchHostels = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/admin/hostels");
      setHostels(response.data.hostels || []);
    } catch (error) {
      toast.error("Failed to load hostels");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div style={{ minHeight: "100vh", background: "#081028", paddingBottom: "100px", fontFamily: "Poppins" }}>
      <div className="gradient-header mb-6" style={{ paddingBottom: "40px", borderBottomLeftRadius: "30px", borderBottomRightRadius: "30px" }}>
        <h1 className="text-h1" style={{ color: "white" }}>
          Hostel Management
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)" }}>Manage approved hostels & credentials</p>
      </div>

      <div className="p-4" style={{ marginTop: "-30px" }}>
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
                    onClick={() => setSelectedHostel(h)}
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
                    onClick={() => setSelectedHostel(h)}
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
                        title: "Remove hostel?",
                        message: "This will permanently delete hostel data (rooms/beds/residents/payments/notifications).",
                        action: "deleteHostel",
                        ownerId: h.hostelId || h._id,
                      })
                    }
                    className="btn-icon"
                    style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)", color: "#fff" }}
                    aria-label="Delete hostel"
                  />

                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Credentials Modal */}
      {selectedHostel && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="animate-slide-up w-full max-w-[400px] max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl relative glass-card"
            style={{ background: "rgba(11,23,57,0.75)" }}
          >
            <button
              type="button"
              onClick={() => setSelectedHostel(null)}
              className="absolute top-4 right-4 p-2 rounded-full"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
              aria-label="Close"
            >
              <ShieldAlert size={18} />
            </button>

            <h2 className="text-xl font-bold mb-1 text-center">{selectedHostel.hostelName}</h2>
            <p className="text-xs text-center text-muted mb-6">Owner: {selectedHostel.ownerName}</p>

            {/* QR Section */}
            <div className="mb-6 flex flex-col items-center">
              <div className="p-2 border rounded-2xl shadow-sm mb-3" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)" }}>
                <img
                  src={buildQrUrl(selectedHostel.qrCodeUrl)}
                  alt="QR"
                  style={{ width: 150, height: 150, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)" }}
                />
              </div>

              <div className="flex gap-2 w-full">
                <a
                  href={buildQrUrl(selectedHostel.qrCodeUrl)}
                  download
                  className="flex-1 py-2 rounded-xl flex justify-center items-center gap-2 text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff" }}
                >
                  <Download size={14} /> Download QR
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedHostel.publicUrl, "Link")}
                  className="flex-1 py-2 rounded-xl flex justify-center items-center gap-2 text-xs font-semibold"
                  style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.22)", color: "#EFFFF8" }}
                >
                  <Copy size={14} /> Copy Link
                </button>
              </div>
            </div>

            {/* Credentials Section */}
            <div className="rounded-2xl p-4 mb-4 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)" }}>
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Username</p>
                <button type="button" onClick={() => handleCopy(selectedHostel.phone, "Username")} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
                  <Copy size={12} />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 mb-3">
                <a
                  href={`tel:${selectedHostel.phone}`}
                  className="font-semibold"
                  style={{ textDecoration: "none", color: "var(--primary-dark)", padding: "10px 12px", borderRadius: 14, background: "rgba(15, 93, 70, 0.08)", border: "1px solid rgba(15, 93, 70, 0.12)" }}
                >
                  {selectedHostel.phone}
                </a>

                <a
                  href={`https://wa.me/91${String(selectedHostel.phone || "").replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, borderRadius: 14, background: "rgba(37, 211, 102, 0.10)", border: "1px solid rgba(37, 211, 102, 0.15)", color: "#25D366", textDecoration: "none", flex: "0 0 auto" }}
                  aria-label="WhatsApp owner"
                  
                >
                  <MessageCircle size={18} />
                </a>
              </div>

              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Temporary Password</p>
                <button type="button" onClick={() => handleCopy(selectedHostel.tempPassword, "Password")} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
                  <Copy size={12} />
                </button>
              </div>

              <p className="font-semibold" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff" }}>
                {selectedHostel.tempPassword || "N/A"}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleCopyAll(selectedHostel)}
className="w-full py-3 rounded-xl font-medium text-sm flex justify-center items-center gap-2" style={{ background: "linear-gradient(135deg, rgba(15,93,70,1) 0%, rgba(15,122,94,1) 100%)" , color: "#fff"}}
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
            </div>

            <button
              type="button"
              onClick={() => setSelectedHostel(null)}
              className="w-full mt-4 py-3 rounded-xl font-semibold"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

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
                    ? "Deleting..."
                    : "Delete"
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
  );
}

export default HostelManagement;

