import React, { useEffect } from "react";
import { X, Building, User, FileText, CheckCircle, HelpCircle } from "lucide-react";
import { useDrawer } from "../contexts/DrawerContext";
import { COLORS } from "../constants/theme";

// Lazy loaded or directly imported panels
// We will create these panel components later
// import HostelDrawerPanel from "./panels/HostelDrawerPanel";
// import OwnerDrawerPanel from "./panels/OwnerDrawerPanel";
// import RequestDrawerPanel from "./panels/RequestDrawerPanel";

export const AdminRightDrawer = React.memo(() => {
  const { isOpen, view, data, closeDrawer } = useDrawer();

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) closeDrawer();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, closeDrawer]);

  if (!isOpen && !view) return null;

  const renderContent = () => {
    switch (view) {
      case "owner":
        return (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-2xl font-bold border border-slate-700">
                {data?.name?.charAt(0) || "U"}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{data?.name || "Owner Profile"}</h3>
                <p className="text-xs text-emerald-400 font-medium">Active Subscription</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Company / Group</p>
                <p className="text-sm text-white font-medium">{data?.company || "Green Valley Group"}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Phone</p>
                  <p className="text-sm text-white font-medium">{data?.phone || "+91 9876543210"}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Email</p>
                  <p className="text-sm text-white font-medium truncate">{data?.email || "contact@owner.com"}</p>
                </div>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Metrics</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-900 rounded-lg"><span className="text-slate-400 text-xs">Hostels:</span> <span className="text-white font-bold">2</span></div>
                  <div className="p-2 bg-slate-900 rounded-lg"><span className="text-slate-400 text-xs">Residents:</span> <span className="text-white font-bold">145</span></div>
                  <div className="p-2 bg-slate-900 rounded-lg col-span-2"><span className="text-slate-400 text-xs">MRR:</span> <span className="text-emerald-400 font-bold">₹15,000</span></div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition">Chat with Owner</button>
              <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition">View Full Profile</button>
              <button className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold transition">Suspend Account</button>
            </div>
          </div>
        );
      case "request":
        return (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{data?.title || "Request"}</h3>
              <p className="text-sm text-slate-400">{data?.subtitle} • {data?.owner}</p>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-6">
              <p className="text-xs text-slate-400 mb-2">Status</p>
              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">{data?.status || "Pending"}</span>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-8 space-y-3 text-sm text-slate-300">
              <p><span className="text-slate-500">Submitted:</span> {new Date(data?.timestamp || Date.now()).toLocaleString()}</p>
              <p><span className="text-slate-500">Priority:</span> {data?.priority || "High"}</p>
              <p><span className="text-slate-500">Category:</span> {data?.queueCategory || "Action Required"}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition">Approve Request</button>
              <button className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold transition">Reject Request</button>
              <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition">Assign to Team</button>
            </div>
          </div>
        );
      case "ticket":
      case "hostel":
      default:
        return (
          <div className="p-6 flex flex-col items-center justify-center h-64 text-center">
            <FileText size={48} className="text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">{data?.title || data?.name || "Details"}</h3>
            <p className="text-sm text-slate-400 mb-6">Detailed view for this item is available in the main dashboard module.</p>
            <button className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition">View Full Details</button>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (view) {
      case "hostel": return "Hostel Details";
      case "owner": return "Owner Profile";
      case "request": return "Request Command";
      case "ticket": return "Support Ticket";
      default: return "Details Panel";
    }
  };

  const getIcon = () => {
    switch (view) {
      case "hostel": return <Building size={18} className="text-emerald-400" />;
      case "owner": return <User size={18} className="text-blue-400" />;
      case "request": return <CheckCircle size={18} className="text-amber-400" />;
      case "ticket": return <HelpCircle size={18} className="text-purple-400" />;
      default: return <FileText size={18} className="text-slate-400" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[6000] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-screen z-[6010] flex flex-col shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ 
          width: "min(480px, 100vw)",
          background: "rgba(11, 17, 32, 0.95)",
          backdropFilter: "blur(20px)",
          borderLeft: `1px solid ${COLORS.border}`
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-3">
            {getIcon()}
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">{getTitle()}</h2>
          </div>
          <button 
            onClick={closeDrawer}
            className="p-2 rounded-full hover:bg-white/10 transition text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {renderContent()}
        </div>
      </div>
    </>
  );
});

export default AdminRightDrawer;
