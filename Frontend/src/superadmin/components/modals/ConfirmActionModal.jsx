import React, { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle2, UserCheck, ShieldAlert, Loader2, Zap, Copy, ExternalLink, Send, Key, Check } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../../services/api";

export const ConfirmActionModal = React.memo(({
  isOpen,
  onClose,
  actionType, // "approve" | "reject" | "assign" | "activate"
  requestData,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Rejection & Assignment state
  const [rejectReason, setRejectReason] = useState("");
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [teamList, setTeamList] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");

  // Activation / Subscription state
  const [planType, setPlanType] = useState("HostelMate Unified Plan");
  const [amount, setAmount] = useState(0);
  const [isTrial, setIsTrial] = useState(true);
  const [isFreeAccess, setIsFreeAccess] = useState(false);
  const [activationNotes, setActivationNotes] = useState("");

  // Activation result state (One-time display)
  const [activationResult, setActivationResult] = useState(null);
  const [sendingCredentials, setSendingCredentials] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState("issued");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setRejectReason("");
      setSelectedAssignee("");
      setPlanType("HostelMate Unified Plan");
      setAmount(0);
      setIsTrial(true);
      setIsFreeAccess(false);
      setActivationNotes("");
      setActivationResult(null);
      setSendingCredentials(false);
      setDeliveryStatus("issued");
      setCopiedLink(false);
      setCopiedCreds(false);
      
      if (actionType === "assign") {
        fetchTeam();
      }
    }
  }, [isOpen, actionType]);

  const handleCloseModal = () => {
    // Wipe sensitive plaintext credentials from state on close
    setActivationResult(null);
    onClose();
  };

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
  const targetHostelId = requestData.hostelId || requestData._id || requestData.id;
  const hostelName = requestData.hostelName || requestData.title || requestData.subtitle || requestData.name || requestData.hostel?.name || "Hostel";
  const ownerName = requestData.ownerName || requestData.owner || requestData.owner?.fullName || requestData.owner?.name || requestData.hostel?.owner?.fullName || "Owner";
  const ownerPhone = requestData.phone || requestData.ownerPhone || requestData.mobile || requestData.phoneNumber || requestData.owner?.phone || requestData.owner?.phoneNumber || "";
  const ownerEmail = requestData.email || requestData.ownerEmail || requestData.owner?.email || requestData.hostel?.owner?.email || "";

  const handleSendCredentials = async (ownerId) => {
    if (sendingCredentials) return;
    setSendingCredentials(true);
    const toastId = toast.loading("Sending credentials...");

    try {
      const res = await api.post(`/api/admin/owners/${ownerId}/send-credentials`).catch(() =>
        api.post(`/api/admin/hostels/${targetHostelId}/send-credentials`)
      );

      if (res.data?.success) {
        toast.success("Credentials sent successfully!", { id: toastId });
        setDeliveryStatus("sent");
      } else if (res.data?.unconfigured) {
        toast.error("Credential delivery service is not configured.", { id: toastId });
        setDeliveryStatus("unconfigured");
      } else {
        toast.error(res.data?.message || "Unable to send credentials. Please try again.", { id: toastId });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to send credentials. Please try again.", { id: toastId });
    } finally {
      setSendingCredentials(false);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      if (actionType === "approve") {
        const endpoint = `/api/admin/approve/${requestId}`;
        const res = await api.put(endpoint, requestData).catch(() => 
          api.post(`/api/auth/approve/${requestId}`, requestData)
        );
        
        if (res.data?.success !== false) {
          onSuccess && onSuccess("activation_pending", res.data?.message || "Registration approved! Draft created and pending activation.");
          handleCloseModal();
        } else {
          setError(res.data?.message || "Unable to approve this request.");
        }
      } else if (actionType === "activate") {
        const endpoint = `/api/admin/hostels/${targetHostelId}/finalize-activation`;
        const res = await api.post(endpoint, {
          planType,
          amount: Number(amount),
          isTrial,
          isFreeAccess,
          notes: activationNotes,
        });

        if (res.data?.success) {
          const activeUsername = ownerPhone || res.data?.credentials?.username || requestData.phone || "";
          const activeTempPassword = res.data?.credentials?.tempPassword || res.data?.credentials?.temporaryPassword || "";
          const activeLoginUrl = res.data?.loginUrl || `${window.location.origin}/owner/login`;
          const subInfo = res.data?.subscription || {
            planName: "HostelMate Unified Plan",
            trialDays: 30,
            trialStartDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
            trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
            trialAmount: 0,
            subscriptionAmount: 10,
            billingCycle: "Month",
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
          };

          const fullNotificationText = res.data?.notificationMessage || [
            "🎉 Welcome to HostelMate",
            "",
            `Hello ${ownerName || "Hostel Owner"},`,
            "",
            `Your hostel "${hostelName || "-"}" has been successfully activated.`,
            "",
            "🔐 Login Details",
            `Username: ${activeUsername}`,
            `Temporary Password: ${activeTempPassword}`,
            "",
            `📦 Subscription: ${subInfo.planName || "HostelMate Unified Plan"}`,
            `🎁 Trial Period: ${subInfo.trialDays || 30} Days Free`,
            "",
            `📅 Trial Start Date: ${subInfo.trialStartDate}`,
            `📅 Trial End Date: ${subInfo.trialEndDate}`,
            "",
            "💰 Subscription Details",
            `Trial Amount: ₹${subInfo.trialAmount ?? 0}`,
            `Subscription Amount: ₹${subInfo.subscriptionAmount ?? 10} / ${subInfo.billingCycle || "Month"}`,
            "",
            `📅 Expiry Date: ${subInfo.expiryDate || subInfo.trialEndDate}`,
            "",
            "🔗 Login:",
            `${activeLoginUrl}`,
            "",
            "⚠️ Please change your password immediately after login.",
            "",
            "Thank you for choosing HostelMate ❤️",
          ].join("\n");

          const resultObj = {
            username: activeUsername,
            tempPassword: activeTempPassword,
            loginUrl: activeLoginUrl,
            ownerId: res.data?.ownerId || requestData.ownerId || requestData.owner?._id,
            credentialStatus: res.data?.credentialStatus || "issued",
            fullName: ownerName,
            email: ownerEmail,
            phone: ownerPhone,
            hostelName: hostelName,
            subscription: subInfo,
            notificationMessage: fullNotificationText,
          };
          setActivationResult(resultObj);
          setDeliveryStatus(resultObj.credentialStatus);
          onSuccess && onSuccess("activated", "Hostel activated successfully!");
        } else {
          setError(res.data?.message || "Failed to finalize hostel activation.");
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
          handleCloseModal();
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
          handleCloseModal();
        } else {
          setError(res.data?.message || "Unable to assign this request.");
        }
      }
    } catch (err) {
      console.error(`Error during ${actionType}:`, err);
      let errMsg = err.response?.data?.message || err.response?.data?.error;
      if (!errMsg) {
        if (err.response?.status === 403) {
          errMsg = "403 Forbidden: You do not have permission to execute this administrative action.";
        } else if (err.response?.status === 409) {
          if (err.response?.data?.code === "OWNER_ACTIVE_ON_ANOTHER_HOSTEL") {
            errMsg = "An active owner account with this phone number already exists and is managing another property.";
          } else {
            errMsg = "Conflict: An active account with these details already exists.";
          }
        } else if (err.response?.status === 404) {
          errMsg = "Hostel or registration record not found.";
        } else {
          errMsg = `Unable to complete ${actionType} action. Please try again.`;
        }
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[7000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        onClick={() => !loading && onClose()}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#131C2E] border-t sm:border border-[#202B45] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden text-white z-10">
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
            {actionType === "activate" && (
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Zap size={18} />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-white">
                {actionType === "approve" && "Approve Registration"}
                {actionType === "reject" && "Reject Registration"}
                {actionType === "assign" && "Assign Registration"}
                {actionType === "activate" && "Activate Hostel & Setup Subscription"}
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
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs font-medium">
              <AlertTriangle size={16} className="text-[#EF4444] shrink-0 mt-0.5" />
              <p className="flex-1">{error}</p>
            </div>
          )}

          {activationResult ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <CheckCircle2 size={20} className="shrink-0 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-extrabold text-white">Owner Account Activated</h4>
                  <p className="text-xs text-slate-300">
                    Owner: <strong className="text-white">{activationResult.fullName || ownerName}</strong> | Phone: <strong className="text-white">{activationResult.phone || requestData.phone || activationResult.username}</strong>
                  </p>
                </div>
              </div>

              {/* Login Credentials & Password Card */}
              <div className="p-3.5 bg-[#0B1220] border border-amber-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Key size={12} /> Login Credentials
                  </label>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md font-mono">
                    Temporary Password Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#131C2E] p-2.5 rounded-lg border border-[#202B45]">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Username</span>
                    <span className="font-mono text-white font-bold">{activationResult.username}</span>
                  </div>
                  <div className="bg-[#131C2E] p-2.5 rounded-lg border border-amber-500/30">
                    <span className="text-[10px] text-amber-400 uppercase font-bold block">Temporary Password</span>
                    <span className="font-mono text-white font-bold tracking-wider">{activationResult.tempPassword || "-"}</span>
                  </div>
                </div>

                {/* Login URL */}
                <div className="flex items-center justify-between gap-2 bg-[#131C2E] p-2.5 rounded-lg border border-[#202B45]">
                  <span className="text-xs font-mono text-emerald-300 truncate select-all">{activationResult.loginUrl}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={activationResult.loginUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-md text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <ExternalLink size={14} />
                      Open Login
                    </a>
                  </div>
                </div>
              </div>

              {/* Complete Subscription & Trial Information */}
              <div className="p-3.5 bg-[#0B1220] border border-[#202B45] rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-[#202B45] pb-1.5">
                  <span className="text-slate-400 font-medium">Subscription Plan</span>
                  <span className="text-emerald-400 font-bold">{activationResult.subscription?.planName || "HostelMate Unified Plan"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#202B45] pb-1.5">
                  <span className="text-slate-400 font-medium">Trial Period</span>
                  <span className="text-amber-400 font-bold">{activationResult.subscription?.trialDays || 30} Days Free</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#202B45] pb-1.5">
                  <span className="text-slate-400 font-medium">Trial Start Date</span>
                  <span className="text-white font-semibold">{activationResult.subscription?.trialStartDate || "-"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#202B45] pb-1.5">
                  <span className="text-slate-400 font-medium">Trial End Date</span>
                  <span className="text-white font-semibold">{activationResult.subscription?.trialEndDate || "-"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#202B45] pb-1.5">
                  <span className="text-slate-400 font-medium">Trial Amount</span>
                  <span className="text-emerald-400 font-bold">₹{activationResult.subscription?.trialAmount ?? 0}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#202B45] pb-1.5">
                  <span className="text-slate-400 font-medium">Subscription Amount</span>
                  <span className="text-white font-bold">₹{activationResult.subscription?.subscriptionAmount ?? 10} / {activationResult.subscription?.billingCycle || "Month"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Expiry Date</span>
                  <span className="text-amber-400 font-bold">{activationResult.subscription?.expiryDate || activationResult.subscription?.trialEndDate || "-"}</span>
                </div>
              </div>

              {/* Copy Login Details Full Notification Button */}
              <div className="p-3 bg-[#0B1220] border border-[#202B45] rounded-xl flex items-center justify-between gap-3">
                <div className="text-xs text-slate-300">
                  <p className="font-semibold text-white">Full Onboarding Notification</p>
                  <p className="text-[11px] text-slate-400">Copy formatted welcome message with credentials & terms</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activationResult.notificationMessage);
                    setCopiedCreds(true);
                    toast.success("Login details copied to clipboard!");
                    setTimeout(() => setCopiedCreds(false), 2000);
                  }}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shrink-0"
                >
                  {copiedCreds ? <Check size={14} /> : <Copy size={14} />}
                  {copiedCreds ? "Copied!" : "Copy Login Details"}
                </button>
              </div>

              {/* Send Credentials Button & Delivery Status */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  Status: <strong className="text-white capitalize">{deliveryStatus}</strong>
                </div>
                <button
                  onClick={() => handleSendCredentials(activationResult.ownerId)}
                  disabled={sendingCredentials}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {sendingCredentials ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {sendingCredentials ? "Sending..." : "Send Credentials via WhatsApp"}
                </button>
              </div>
            </div>
          ) : (
            <>
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

              {actionType === "activate" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300">
                    Finalize activation for <strong className="text-white">{hostelName}</strong>. This will create the Owner account, provision the 30-day Free Trial on the <strong>HostelMate Unified Plan</strong>, issue login credentials, and trigger credential delivery.
                  </p>

                  <div className="p-4 rounded-xl bg-[#0B1220] border border-[#202B45] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-[#202B45] pb-2">
                      <span className="text-slate-400 font-medium">Hostel</span>
                      <span className="text-white font-bold">{hostelName || "Hostel"}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#202B45] pb-2">
                      <span className="text-slate-400 font-medium">Owner</span>
                      <span className="text-white font-bold">{ownerName || "Owner"}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#202B45] pb-2">
                      <span className="text-slate-400 font-medium">Phone</span>
                      <span className="text-white font-mono font-bold">{ownerPhone || "Not provided"}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#202B45] pb-2">
                      <span className="text-slate-400 font-medium">Subscription</span>
                      <span className="text-emerald-400 font-bold">HostelMate Unified Plan</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#202B45] pb-2">
                      <span className="text-slate-400 font-medium">Trial Period</span>
                      <span className="text-amber-400 font-bold">30 Days Free</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#202B45] pb-2">
                      <span className="text-slate-400 font-medium">Billing Model</span>
                      <span className="text-slate-300 font-semibold">₹10 / active resident / 30-day period</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Initial Amount</span>
                      <span className="text-emerald-400 font-black text-sm">₹0 (Free Trial)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes / Internal Terms</label>
                    <input 
                      type="text" 
                      value={activationNotes} 
                      onChange={(e) => setActivationNotes(e.target.value)}
                      placeholder="Optional activation & billing notes..."
                      className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#202B45] bg-[#0B1220]/40">
          {activationResult ? (
            <button
              onClick={handleCloseModal}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition cursor-pointer min-h-[48px]"
            >
              Done / Close Activation Result
            </button>
          ) : (
            <>
              <button
                onClick={handleCloseModal}
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
                    "Approve Draft"
                  )}
                </button>
              )}

              {actionType === "activate" && (
                <button
                  onClick={handleExecute}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 min-h-[48px]"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Activating & Creating Owner...
                    </>
                  ) : (
                    "Finalize Activation"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default ConfirmActionModal;
