import React from "react";
import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import PageContainer from "../layouts/PageContainer";
import StatusBadge from "../components/feedback/StatusBadge";
import QuickActionButton from "../components/widgets/QuickActionButton";
import Tabs from "../components/navigation/Tabs";
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
  Settings 
} from "lucide-react";
import { COLORS } from "../constants/theme";

export const HostelDetailsLayout = React.memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const handleImpersonation = () => {
    alert("Initiating secure impersonation support mode. A temporary token is generated and logged in Audit Trails.");
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <Activity size={12} /> },
    { id: "owner", label: "Owner Profile", icon: <User size={12} /> },
    { id: "operations", label: "Operations", icon: <Building size={12} /> },
    { id: "financials", label: "Financials", icon: <DollarSign size={12} /> },
    { id: "subscription", label: "Subscription", icon: <CreditCard size={12} /> },
    { id: "communication", label: "Communication", icon: <MessageSquare size={12} /> },
    { id: "support", label: "Support", icon: <HeartHandshake size={12} /> },
    { id: "documents", label: "Documents", icon: <FileText size={12} /> },
    { id: "audit", label: "Audit Trails", icon: <ShieldAlert size={12} /> },
    { id: "settings", label: "Settings", icon: <Settings size={12} /> }
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
      <div 
        className="p-6 rounded-[26px] border border-white/5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
        style={{ background: "rgba(23, 32, 51, 0.4)" }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div 
            className="w-14 h-14 rounded-2xl border flex items-center justify-center font-bold text-xl select-none"
            style={{ borderColor: COLORS.border, background: COLORS.surfaceLight, color: COLORS.primaryLight }}
          >
            A
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-extrabold text-white">Apex Boys PG (Hostel Code: RMH482)</h2>
              <StatusBadge status="active" />
            </div>
            <p className="text-xs text-slate-300 mt-1">Owner: Rajesh Kumar | Phone: +91 98765 43210 | Plan: Pro Plan</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <QuickActionButton 
            label="Support Session" 
            icon={<ShieldAlert size={14} />} 
            variant="danger" 
            onClick={handleImpersonation}
          />
        </div>
      </div>

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
