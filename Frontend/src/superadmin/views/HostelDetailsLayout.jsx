import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Outlet } from "react-router-dom";
import { 
  ArrowLeft, 
  ShieldAlert, 
  Sparkles, 
  User, 
  MessageSquare, 
  HeartHandshake, 
  Activity, 
  Building, 
  DollarSign, 
  CreditCard, 
  FileText, 
  Settings,
  Loader2,
  Trash2,
  AlertTriangle,
  X
} from "lucide-react";
import { COLORS } from "../constants/theme";
import { useHostel } from "../hooks/useHostel";
import { api } from "../../services/api";
import toast from "react-hot-toast";
import PageContainer from "../layouts/PageContainer";
import StatusBadge from "../components/feedback/StatusBadge";
import QuickActionButton from "../components/widgets/QuickActionButton";
import Tabs from "../components/navigation/Tabs";

export const HostelDetailsLayout = React.memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: hostelData, loading } = useHostel(id);

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Data normalization
  const hostelName = hostelData?.hostelName || hostelData?.name || hostelData?.hostel?.name || "Hostel Name";
  const ownerName = hostelData?.owner?.fullName || hostelData?.owner?.ownerName || hostelData?.ownerName || hostelData?.owner?.name || hostelData?.hostel?.owner?.fullName || "Not provided";
  const ownerPhone = hostelData?.owner?.phone || hostelData?.phone || hostelData?.hostel?.owner?.phone || "Not provided";
  const ownerEmail = hostelData?.owner?.email || hostelData?.email || hostelData?.hostel?.owner?.email || "";
  const ownerPhoto = hostelData?.owner?.photo || hostelData?.owner?.profileImage || hostelData?.ownerPhoto || hostelData?.hostel?.owner?.photo || "";
  const hostelAddress = hostelData?.address || hostelData?.details?.address || hostelData?.city || "Not provided";
  const status = hostelData?.status || hostelData?.subscriptionStatus || hostelData?.hostel?.status || "active";
  const plan = hostelData?.plan || hostelData?.planType || hostelData?.hostel?.plan || "Basic";

  // Record Admin Activity HOSTEL_VIEW
  React.useEffect(() => {
    if (id && hostelData) {
      const hName = hostelData?.hostelName || hostelData?.name || hostelData?.hostel?.name || "Hostel";
      api.post("/api/admin/activity/view-hostel", { hostelId: id, hostelName: hName }).catch(() => {});
    }
  }, [id, hostelData]);

  const handleImpersonation = async () => {
    const ownerId = hostelData?.owner?._id || hostelData?.owner?.id || hostelData?.ownerId || hostelData?.hostel?.owner?._id;
    if (!ownerId) {
      return toast.error("Owner not found for this hostel");
    }
    
    try {
      const toastId = toast.loading("Initiating secure impersonation session...");
      const res = await api.post("/api/admin/impersonate", { ownerId });
      
      if (res.data.success) {
        toast.success("Impersonation started", { id: toastId });
        window.open(`/owner-dashboard-redirect?token=${res.data.token}`, '_blank');
      }
    } catch (err) {
      toast.error("Failed to start impersonation session");
    }
  };

  const handleDeleteHostel = async () => {
    if (confirmInput.trim().toLowerCase() !== hostelName.trim().toLowerCase()) {
      return toast.error("Hostel name does not match exact confirmation string");
    }

    setIsDeleting(true);
    const toastId = toast.loading("Moving hostel to 60-day Trash...");

    try {
      const res = await api.delete(`/api/admin/hostels/${id}`);
      if (res.data.success) {
        toast.success(res.data.message || "Hostel moved to Trash (retained for 60 days). Financial records preserved.", { id: toastId });
        setDeleteModalOpen(false);
        navigate("/admin/hostels");
      } else {
        toast.error(res.data.message || "Unable to delete hostel. Please try again.", { id: toastId });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to delete hostel. Please try again.", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <Activity size={12} /> },
    { id: "owner", label: "Owner", icon: <User size={12} /> },
    { id: "rooms", label: "Rooms", icon: <Building size={12} /> },
    { id: "residents", label: "Residents", icon: <User size={12} /> },
    { id: "payments", label: "Payments", icon: <CreditCard size={12} /> },
    { id: "subscription", label: "Subscription", icon: <ShieldAlert size={12} /> },
    { id: "revenue", label: "Revenue", icon: <DollarSign size={12} /> },
    { id: "storage", label: "Storage", icon: <FileText size={12} /> },
    { id: "health", label: "Health", icon: <Activity size={12} /> },
    { id: "audit", label: "Audit Timeline", icon: <ShieldAlert size={12} /> },
    { id: "support", label: "Support History", icon: <HeartHandshake size={12} /> }
  ];

  const currentTab = location.pathname.split("/").pop();

  return (
    <PageContainer>
      {/* Back button */}
      <button 
        onClick={() => navigate("/admin/hostels")}
        className="flex items-center gap-2 text-xs font-bold mb-4 hover:text-white transition cursor-pointer"
        style={{ color: COLORS.textMuted }}
      >
        <ArrowLeft size={14} />
        Back to Hostels Registry
      </button>

      {/* CRM Profile Header */}
      {loading ? (
        <div className="p-6 rounded-[26px] border border-white/5 mb-6 flex justify-center items-center h-24" style={{ background: "rgba(23, 32, 51, 0.4)" }}>
          <Loader2 className="animate-spin text-purple-400" size={32} />
        </div>
      ) : (
      <div 
        className="p-6 rounded-[26px] border border-white/5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
        style={{ background: "rgba(23, 32, 51, 0.4)" }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div 
            className="w-14 h-14 rounded-2xl border flex items-center justify-center font-bold text-xl select-none uppercase overflow-hidden shrink-0"
            style={{ borderColor: COLORS.border, background: COLORS.surfaceLight, color: COLORS.primaryLight }}
          >
            {ownerPhoto ? (
              <img 
                src={ownerPhoto} 
                alt={ownerName} 
                className="w-full h-full object-cover" 
                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
              />
            ) : (
              hostelName.charAt(0) || "H"
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-extrabold text-white">{hostelName}</h2>
              <StatusBadge status={status} />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{plan}</span>
            </div>
            <div className="text-xs text-slate-300 mt-1 font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Owner: <strong className="text-white font-semibold">{ownerName}</strong></span>
              <span className="text-slate-600">•</span>
              <span>Phone: <strong className="text-white font-semibold">{ownerPhone}</strong></span>
              {ownerEmail && (
                <>
                  <span className="text-slate-600">•</span>
                  <span>Email: <strong className="text-slate-300 font-semibold">{ownerEmail}</strong></span>
                </>
              )}
              {hostelAddress && hostelAddress !== "Not provided" && (
                <>
                  <span className="text-slate-600">•</span>
                  <span>Address: <strong className="text-slate-400">{hostelAddress}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center gap-2 shrink-0">
            <QuickActionButton 
              label="Support Session" 
              icon={<ShieldAlert size={14} />} 
              variant="primary" 
              onClick={handleImpersonation}
            />
            <QuickActionButton 
              label="Remove Hostel" 
              icon={<Trash2 size={14} />} 
              variant="danger" 
              onClick={() => {
                setConfirmInput("");
                setDeleteModalOpen(true);
              }}
            />
          </div>
        </div>
      </div>
      )}

      {/* Horizontal Tabs Selection */}
      <Tabs 
        tabs={tabs} 
        activeTab={currentTab} 
        onChange={(tabId) => navigate(`/admin/hostels/${id}/${tabId}`)} 
        className="mb-6 overflow-x-auto"
      />

      {/* Tab Output Renderer */}
      <div className="min-h-[400px]">
        <Outlet />
      </div>

      {/* Mandatory Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Remove Hostel</h3>
                  <p className="text-xs text-amber-400 mt-0.5">Move to 60-day Trash</p>
                </div>
              </div>
              <button 
                onClick={() => !isDeleting && setDeleteModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                disabled={isDeleting}
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This hostel will be moved to Trash and retained for 60 days. Payment and subscription history will remain preserved.
            </p>

            <div className="p-3.5 bg-black/40 border border-white/5 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Hostel Name:</span>
                <span className="font-bold text-white">{hostelName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Owner Name:</span>
                <span className="font-bold text-white">{ownerName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current Plan:</span>
                <span className="font-bold text-blue-400">{plan}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span className="font-bold text-emerald-400 capitalize">{status}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Type <span className="text-rose-400 select-all font-extrabold">{hostelName}</span> to confirm removal:
              </label>
              <input 
                type="text" 
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={`Type "${hostelName}" here`}
                disabled={isDeleting}
                className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-rose-500 transition min-h-[48px]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-3 rounded-xl text-xs font-bold text-slate-300 border border-white/10 hover:bg-white/5 transition min-h-[48px] cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleDeleteHostel}
                disabled={confirmInput.trim().toLowerCase() !== hostelName.trim().toLowerCase() || isDeleting}
                className="px-5 py-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 min-h-[48px] cursor-pointer shadow-lg shadow-rose-900/30"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Moving to Trash...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Move to Trash
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
});

export default HostelDetailsLayout;
