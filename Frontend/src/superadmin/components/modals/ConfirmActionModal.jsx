import React, { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle2, UserCheck, ShieldAlert, Loader2 } from "lucide-react";
import { api } from "../../../services/api";

export const ConfirmActionModal = React.memo(({
  isOpen,
  onClose,
  actionType, // "approve" | "reject" | "assign"
  requestData,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Rejection state
  const [rejectReason, setRejectReason] = useState("");
  
  // Assignment state
  const [teamList, setTeamList] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [loadingTeam, setLoadingTeam] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setRejectReason("");
      setSelectedAssignee("");
      
      if (actionType === "assign") {
        fetchTeam();
      }
    }
  }, [isOpen, actionType]);

  const fetchTeam = async () => {
    try {
      setLoadingTeam(true);
      const res = await api.get("/api/admin/team");
      if (res.data?.success && Array.isArray(res.data.team)) {
        setTeamList(res.data.team);
        if (res.data.team.length > 0) {
          setSelectedAssignee(res.data.team[0].name || res.data.team[0].id);
        }
      } else {
        setTeamList([
          { id: "team-verification", name: "Verification Team", role: "Compliance & Audit" },
          { id: "team-operations", name: "Operations Team", role: "Onboarding Ops" },
          { id: "team-compliance", name: "Compliance Team", role: "Legal & Regulatory" }
        ]);
        setSelectedAssignee("Verification Team");
      }
    } catch {
      setTeamList([
        { id: "team-verification", name: "Verification Team", role: "Compliance & Audit" },
        { id: "team-operations", name: "Operations Team", role: "Onboarding Ops" },
        { id: "team-compliance", name: "Compliance Team", role: "Legal & Regulatory" }
      ]);
      setSelectedAssignee("Verification Team");
    } finally {
      setLoadingTeam(false);
    }
  };

  if (!isOpen || !requestData) return null;

  const requestId = requestData._id || requestData.id;
  const hostelName = requestData.hostelName || requestData.subtitle || "Hostel";
  const ownerName = requestData.ownerName || requestData.owner || "Owner";

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      if (actionType === "approve") {
        // Call backend approve API
        const endpoint = `/api/admin/approve/${requestId}`;
        const res = await api.put(endpoint, requestData).catch(() => 
          api.post(`/api/auth/approve/${requestId}`, requestData)
        );
        
        if (res.data?.success !== false) {
          onSuccess && onSuccess("approved", res.data?.message || "Registration approved successfully");
          onClose();
        } else {
          setError(res.data?.message || "Unable to approve this request.");
        }
      } else if (actionType === "reject") {
        if (!rejectReason.trim()) {
          setError("Please provide a rejection reason.");
          setLoading(false);
          return;
        }
        
        const res = await api.put(`/api/admin/reject/${requestId}`, { reason: rejectReason }).catch(() => 
          api.post(`/api/auth/reject/${requestId}`, { reason: rejectReason })
        );

        if (res.data?.success !== false) {
          onSuccess && onSuccess("rejected", "Registration rejected");
          onClose();
        } else {
          setError(res.data?.message || "Unable to reject this request.");
        }
      } else if (actionType === "assign") {
        if (!selectedAssignee) {
          setError("Please select a team or admin member.");
          setLoading(false);
          return;
        }
        
        const res = await api.post(`/api/admin/assign/${requestId}`, {
          teamName: selectedAssignee,
          adminId: selectedAssignee
        }).catch(() => api.post(`/api/auth/assign/${requestId}`, { adminId: selectedAssignee }));

        if (res.data?.success !== false) {
          onSuccess && onSuccess("assigned", `Request assigned to ${selectedAssignee}`);
          onClose();
        } else {
          setError(res.data?.message || "Unable to assign this request.");
        }
      }
    } catch (err) {
      console.error(`Error during ${actionType}:`, err);
      const errMsg = err.response?.data?.message || err.message || `Failed to ${actionType} request`;
      if (err.response?.status === 403) {
        setError("403 Forbidden: You do not have permission to execute this administrative action.");
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[7000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#131C2E] border-t sm:border border-[#202B45] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden text-white z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202B45]">
          <div className="flex items-center gap-3">
            {actionType === "approve" && (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={18} />
              </div>
            )}
            {actionType === "reject" && (
              <div className="w-9 h-9 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444]">
                <ShieldAlert size={18} />
              </div>
            )}
            {actionType === "assign" && (
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <UserCheck size={18} />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-white">
                {actionType === "approve" && "Approve Registration"}
                {actionType === "reject" && "Reject Registration"}
                {actionType === "assign" && "Assign Registration"}
              </h3>
              <p className="text-xs text-slate-400">{hostelName} • {ownerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs font-medium">
              <AlertTriangle size={16} className="text-[#EF4444] shrink-0 mt-0.5" />
              <p className="flex-1">{error}</p>
            </div>
          )}

          {actionType === "approve" && (
            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to approve <strong className="text-white">{hostelName}</strong> submitted by <strong className="text-white">{ownerName}</strong>? This will activate the hostel account and notify the owner.
            </p>
          )}

          {actionType === "reject" && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Reason for rejection <span className="text-[#EF4444]">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter detailed reason for rejection (e.g. Invalid Aadhaar document provided)..."
                rows={3}
                className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#EF4444] transition resize-none min-h-[80px]"
              />
            </div>
          )}

          {actionType === "assign" && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Team / Admin
              </label>

              {loadingTeam ? (
                <div className="py-4 flex items-center justify-center text-xs text-slate-400 gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-400" />
                  Loading team members...
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {teamList.map((item) => {
                    const itemName = item.name || item.fullName || item.id;
                    const isSelected = selectedAssignee === itemName || selectedAssignee === item.id;
                    return (
                      <label
                        key={item.id || itemName}
                        onClick={() => setSelectedAssignee(itemName)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer min-h-[48px] ${
                          isSelected
                            ? "bg-blue-500/10 border-blue-500/40 text-white"
                            : "bg-[#0B1220]/60 border-[#202B45] text-slate-300 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="assignee"
                            checked={isSelected}
                            onChange={() => setSelectedAssignee(itemName)}
                            className="accent-blue-500 w-4 h-4"
                          />
                          <div>
                            <p className="text-xs font-bold text-white">{itemName}</p>
                            <p className="text-[10px] text-slate-400">{item.role || item.email || "Admin"}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#202B45] bg-[#0B1220]/40">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 border border-transparent transition disabled:opacity-50 min-h-[48px]"
          >
            Cancel
          </button>

          {actionType === "approve" && (
            <button
              onClick={handleExecute}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 min-h-[48px]"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve"
              )}
            </button>
          )}

          {actionType === "reject" && (
            <button
              onClick={handleExecute}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-[#EF4444] hover:bg-red-600 shadow-lg shadow-red-500/20 transition disabled:opacity-50 min-h-[48px]"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Request"
              )}
            </button>
          )}

          {actionType === "assign" && (
            <button
              onClick={handleExecute}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition disabled:opacity-50 min-h-[48px]"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default ConfirmActionModal;
