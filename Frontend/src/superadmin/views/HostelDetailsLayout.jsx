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
  Loader2
} from "lucide-react";
import { COLORS } from "../constants/theme";
import { useHostel } from "../hooks/useHostel";
import { api } from "../../services/api";
import toast from "react-hot-toast";

export const HostelDetailsLayout = React.memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: hostelData, loading } = useHostel(id);

  const handleImpersonation = async () => {
    if (!hostelData?.hostel?.owner?._id) {
      return toast.error("Owner not found for this hostel");
    }
    
    try {
      const toastId = toast.loading("Initiating secure impersonation session...");
      const res = await api.post("/api/admin/impersonate", { ownerId: hostelData.hostel.owner._id });
      
      if (res.data.success) {
        toast.success("Impersonation started", { id: toastId });
        // The token is for the owner. We could store it in a temporary storage, 
        // but for now we just show a success message since we are the superadmin.
        // In a real app, this would open a new tab with the owner's dashboard injecting this token.
        window.open(`/owner-dashboard-redirect?token=${res.data.token}`, '_blank');
      }
    } catch (err) {
      toast.error("Failed to start impersonation session");
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
        className="flex items-center gap-2 text-xs font-bold mb-4 hover:text-white transition"
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
            className="w-14 h-14 rounded-2xl border flex items-center justify-center font-bold text-xl select-none uppercase"
            style={{ borderColor: COLORS.border, background: COLORS.surfaceLight, color: COLORS.primaryLight }}
          >
            {hostelData?.hostel?.name?.charAt(0) || "H"}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-extrabold text-white">{hostelData?.hostel?.name || "Hostel Name"}</h2>
              <StatusBadge status={hostelData?.hostel?.status || "active"} />
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Owner: {hostelData?.hostel?.owner?.fullName || "Unknown"} | 
              Phone: {hostelData?.hostel?.owner?.phone || "N/A"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center gap-2 shrink-0">
            <QuickActionButton 
              label="Support Session" 
              icon={<ShieldAlert size={14} />} 
              variant="danger" 
              onClick={handleImpersonation}
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
    </PageContainer>
  );
});

export default HostelDetailsLayout;
