import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import useHostel from "../../hooks/useHostel";
import { 
  Loader2, AlertCircle, Building, Mail, Phone, MapPin, Key, 
  Send, Copy, ExternalLink, ShieldCheck, Clock, CheckCircle2, 
  AlertTriangle, RefreshCw, X, Check
} from "lucide-react";
import { api } from "../../../services/api";
import toast from "react-hot-toast";

export default function CustomerOwner() {
  const { id } = useParams();
  const { data: hostelData, loading, error, refetch } = useHostel(id);

  const [ownerData, setOwnerData] = useState(null);
  const [loadingOwner, setLoadingOwner] = useState(false);
  
  // WhatsApp send state
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);

  // Admin Reset Password Modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const fetchOwnerDetails = async () => {
    if (!id) return;
    try {
      setLoadingOwner(true);
      const res = await api.get(`/api/admin/hostels/${id}/owner`);
      if (res.data?.success && res.data?.data) {
        setOwnerData(res.data.data);
      }
    } catch (err) {
      console.warn("Could not fetch detailed owner profile:", err);
    } finally {
      setLoadingOwner(false);
    }
  };

  useEffect(() => {
    fetchOwnerDetails();
  }, [id]);

  if (loading || loadingOwner) {
    return (
      <div className="p-12 flex items-center justify-center text-emerald-500">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (error || !hostelData) {
    return (
      <div className="p-12 text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl m-6 flex flex-col items-center">
        <AlertCircle size={32} className="mb-2" /> Failed to load owner data.
      </div>
    );
  }

  const ownerName = ownerData?.fullName || ownerData?.name || hostelData?.owner?.fullName || hostelData?.ownerName || "Not provided";
  const phone = ownerData?.phone || hostelData?.owner?.phone || hostelData?.phone || "Not provided";
  const email = ownerData?.email || hostelData?.owner?.email || hostelData?.email || "Not provided";
  const address = ownerData?.address || hostelData?.address || "Not provided";
  const photo = ownerData?.photo || ownerData?.profileImage || hostelData?.ownerPhoto || "";
  const ownerId = ownerData?.ownerId || ownerData?._id || hostelData?.owner?._id || hostelData?.ownerId;

  // Credential metadata
  const frontendBase = window.location.origin || "https://hostelmate-saas.vercel.app";
  const loginUrl = ownerData?.loginUrl || `${frontendBase}/owner/login`;
  const deliveryStatus = ownerData?.credentialDeliveryStatus || "not_issued";
  const mustChangePassword = ownerData?.mustChangePassword;
  const firstLogin = ownerData?.firstLogin;
  const passwordChanged = ownerData?.passwordChanged;
  const hasResetToken = ownerData?.hasResetToken;
  const resetExpired = ownerData?.resetExpired;
  const credentialIssuedAt = ownerData?.credentialIssuedAt 
    ? new Date(ownerData.credentialIssuedAt).toLocaleString() 
    : "Not issued";

  // Password status badge rendering
  const renderPasswordStatusBadge = () => {
    if (hasResetToken) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Clock size={12} /> Password Reset Requested
        </span>
      );
    }
    if (resetExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
          <AlertCircle size={12} /> Reset Request Expired
        </span>
      );
    }
    if (passwordChanged || (!mustChangePassword && !firstLogin)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 size={12} /> Password Changed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
        <Key size={12} /> Temporary Password Active
      </span>
    );
  };

  // Credential Delivery Status badge rendering
  const renderDeliveryBadge = (statusStr) => {
    const s = String(statusStr || "").toLowerCase();
    switch (s) {
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold capitalize">
            <CheckCircle2 size={12} /> WhatsApp Sent
          </span>
        );
      case "unconfigured":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold capitalize">
            <AlertTriangle size={12} /> WhatsApp Not Configured
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold capitalize">
            <AlertCircle size={12} /> Delivery Failed
          </span>
        );
      case "issued":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold capitalize">
            <ShieldCheck size={12} /> Issued — Awaiting Send
          </span>
        );
      case "not_issued":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-semibold capitalize">
            <Clock size={12} /> Credentials Not Issued
          </span>
        );
    }
  };

  const lastDeliveryError = ownerData?.lastDeliveryError;

  const handleSendCredentials = async () => {
    if (!ownerId) {
      return toast.error("Owner ID not found for WhatsApp delivery");
    }
    if (sendingWhatsapp) return;

    setSendingWhatsapp(true);
    const toastId = toast.loading("Sending credentials via WhatsApp...");

    try {
      const res = await api.post(`/api/admin/owners/${ownerId}/send-credentials`).catch(() =>
        api.post(`/api/admin/hostels/${id}/send-credentials`)
      );

      if (res.data?.success) {
        toast.success("Credentials sent via WhatsApp successfully!", { id: toastId });
        fetchOwnerDetails();
      } else if (res.data?.unconfigured || res.data?.deliveryStatus === "unconfigured") {
        toast.error(res.data?.message || "WhatsApp credential delivery service is not configured.", { id: toastId });
        fetchOwnerDetails();
      } else {
        toast.error(`WhatsApp delivery failed: ${res.data?.message || "Delivery failed"}`, { id: toastId });
        fetchOwnerDetails();
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.response?.data?.error || "WhatsApp delivery failed";
      toast.error(`WhatsApp delivery failed: ${errorMsg}`, { id: toastId });
      fetchOwnerDetails();
    } finally {
      setSendingWhatsapp(false);
    }
  };

  const handleResetPasswordClick = () => {
    setResetResult(null);
    setResetModalOpen(true);
  };

  const handleExecuteResetPassword = async () => {
    if (!ownerId) {
      return toast.error("Owner ID not found for password reset");
    }
    setIsResetting(true);
    const toastId = toast.loading("Generating new temporary password...");

    try {
      const res = await api.post(`/api/admin/owners/${ownerId}/reset-temp-password`).catch(() =>
        api.put(`/api/admin/owners/${ownerId}/reset-temp-password`)
      );

      if (res.data?.success) {
        toast.success("Temporary password generated successfully!", { id: toastId });
        const creds = res.data.credentials || {};
        setResetResult({
          username: creds.username || phone,
          tempPassword: creds.tempPassword || creds.temporaryPassword || "",
          loginUrl: res.data.loginUrl || loginUrl,
          ownerId: res.data.ownerId || ownerId,
        });
        fetchOwnerDetails();
      } else {
        toast.error(res.data?.message || "Failed to reset temporary password.", { id: toastId });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reset temporary password.", { id: toastId });
    } finally {
      setIsResetting(false);
    }
  };

  const isHostelInTrash = Boolean(hostelData?.isDeleted || ownerData?.isHostelInTrash);
  const trashDaysRemaining = ownerData?.hostelDaysRemaining || 0;
  const deletedAtStr = ownerData?.hostelDeletedAt ? new Date(ownerData.hostelDeletedAt).toLocaleDateString() : (hostelData?.deletedAt ? new Date(hostelData.deletedAt).toLocaleDateString() : "");

  return (
    <div className="p-6 space-y-6">
      {/* HOSTEL IN TRASH PROMINENT BANNER */}
      {isHostelInTrash && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>HOSTEL IN TRASH</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                  {trashDaysRemaining > 0 ? `${trashDaysRemaining} Days Remaining` : "Retained in Trash"}
                </span>
              </h4>
              <p className="text-xs text-slate-300">
                This owner account is linked to <strong className="text-white">{hostelData?.hostelName || "Hostel"}</strong>, which was moved to the 60-day Trash{deletedAtStr ? ` on ${deletedAtStr}` : ""}. Owner login and operational dashboard access are blocked. Historical financial, subscription, and audit records remain 100% preserved.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              if (!window.confirm(`Restore "${hostelData?.hostelName || "this hostel"}" to active registry?`)) return;
              try {
                const toastId = toast.loading("Restoring hostel from Trash...");
                const res = await api.post(`/api/admin/trash/hostels/${id}/restore`);
                if (res.data?.success) {
                  toast.success("Hostel restored successfully!", { id: toastId });
                  refetch();
                  fetchOwnerDetails();
                } else {
                  toast.error(res.data?.message || "Failed to restore hostel", { id: toastId });
                }
              } catch (err) {
                toast.error("Failed to restore hostel");
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-md"
          >
            <RefreshCw size={14} />
            <span>Restore Hostel</span>
          </button>
        </div>
      )}

      {/* Basic Profile Header */}
      <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        <div className="w-24 h-24 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-3xl font-bold border border-emerald-500/20 shrink-0 overflow-hidden">
          {photo ? (
            <img 
              src={photo} 
              alt={ownerName} 
              className="w-full h-full object-cover" 
              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} 
            />
          ) : (
            ownerName.charAt(0) || "U"
          )}
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">{ownerName}</h2>
            <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
              <Building size={14}/> {hostelData?.hostelName || hostelData?.name || "Independent"}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Mail size={16} className="text-slate-500" /> {email}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Phone size={16} className="text-slate-500" /> {phone}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300 col-span-1 md:col-span-2">
              <MapPin size={16} className="text-slate-500" /> {address}
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED OWNER ACCOUNT & CREDENTIALS CARD */}
      <div className="bg-slate-900/60 border border-white/10 p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Owner Account & Credentials</h3>
              <p className="text-xs text-slate-400">Manage owner credentials, login link, and WhatsApp onboarding delivery</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSendCredentials}
              disabled={sendingWhatsapp || isHostelInTrash}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-md min-h-[42px]"
            >
              {sendingWhatsapp ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sendingWhatsapp ? "Sending..." : "Send Credentials via WhatsApp"}
            </button>

            <button
              onClick={handleResetPasswordClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer min-h-[42px]"
            >
              <RefreshCw size={14} />
              Reset Owner Password
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Account Status */}
          <div className="p-4 bg-slate-950/50 border border-white/5 rounded-xl space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Account Status</span>
            {isHostelInTrash ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold capitalize">
                <AlertTriangle size={12} /> Hostel in Trash
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold capitalize">
                <CheckCircle2 size={12} /> {ownerData?.status || "Active"}
              </span>
            )}
          </div>

          {/* Credential Delivery Status */}
          <div className="p-4 bg-slate-950/50 border border-white/5 rounded-xl space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">WhatsApp Delivery Status</span>
            <div className="space-y-1">
              {renderDeliveryBadge(deliveryStatus)}
              {lastDeliveryError && (deliveryStatus === "failed" || deliveryStatus === "unconfigured") && (
                <p className="text-[11px] text-rose-400 font-medium leading-tight mt-1 flex items-start gap-1">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                  <span>Last Error: {lastDeliveryError}</span>
                </p>
              )}
            </div>
          </div>

          {/* Password Status */}
          <div className="p-4 bg-slate-950/50 border border-white/5 rounded-xl space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Password Status</span>
            {renderPasswordStatusBadge()}
          </div>

          {/* First Login Status */}
          <div className="p-4 bg-slate-950/50 border border-white/5 rounded-xl space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">First Login / Onboarding</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
              !firstLogin ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}>
              {!firstLogin ? "Completed" : "Pending First Login"}
            </span>
          </div>

          {/* Credential Issued Date */}
          <div className="p-4 bg-slate-950/50 border border-white/5 rounded-xl space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Credential Issued Date</span>
            <span className="text-xs font-semibold text-slate-200 block">{credentialIssuedAt}</span>
          </div>

          {/* Public Login URL */}
          <div className="p-4 bg-slate-950/50 border border-white/5 rounded-xl space-y-2 col-span-1 md:col-span-2 lg:col-span-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Canonical Owner Login URL</span>
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-2.5 rounded-lg border border-white/10">
              <span className="text-xs font-mono text-emerald-300 truncate select-all">{loginUrl}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(loginUrl);
                    toast.success("Login URL copied to clipboard!");
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Copy size={14} /> Copy Link
                </button>
                <a
                  href={loginUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-md text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <ExternalLink size={14} /> Open Login
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN RESET TEMPORARY PASSWORD MODAL */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Reset Password for {ownerName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Generate a new one-time temporary password</p>
                </div>
              </div>
              <button 
                onClick={() => setResetModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {resetResult ? (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} /> Temporary password generated successfully!
                </div>

                <div className="p-3.5 bg-slate-950 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">New Temporary Password</span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono">Displayed Only Once</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-white/10">
                    <span className="text-xs font-mono text-white tracking-widest font-bold">{resetResult.tempPassword}</span>
                    <button
                      onClick={() => {
                        const credsText = `Username: ${resetResult.username}\nTemporary Password: ${resetResult.tempPassword}\nLogin URL: ${resetResult.loginUrl}`;
                        navigator.clipboard.writeText(credsText);
                        setCopiedCreds(true);
                        toast.success("Credentials copied!");
                        setTimeout(() => setCopiedCreds(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-emerald-500 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedCreds ? <Check size={14} /> : <Copy size={14} />}
                      {copiedCreds ? "Copied!" : "Copy Credentials"}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    Plaintext password will be cleared from state when this dialog is closed. Share it now with the owner.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleSendCredentials()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Send size={14} /> Send via WhatsApp
                  </button>
                  <button
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 border border-white/10 hover:bg-white/5 transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-300 leading-relaxed">
                  This will invalidate all current active sessions for <strong className="text-white">{ownerName}</strong> and generate a new temporary password. The owner will be required to change password on next login.
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    disabled={isResetting}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 border border-white/10 hover:bg-white/5 transition min-h-[44px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteResetPassword}
                    disabled={isResetting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 transition flex items-center gap-2 min-h-[44px] cursor-pointer shadow-lg shadow-amber-900/30"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Key size={14} />
                        Generate Temporary Password
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
