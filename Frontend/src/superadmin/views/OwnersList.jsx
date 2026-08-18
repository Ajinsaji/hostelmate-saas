import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SearchBar from "../components/forms/SearchBar";
import StatusBadge from "../components/feedback/StatusBadge";
import { api } from "../../services/api";
import toast from "react-hot-toast";
import { 
  Play, 
  Pause, 
  KeyRound, 
  Mail, 
  Phone, 
  Building, 
  HardDrive, 
  IndianRupee, 
  Users, 
  MapPin, 
  ShieldCheck, 
  MessageSquare, 
  ExternalLink, 
  RefreshCw, 
  Copy, 
  Check, 
  X, 
  AlertTriangle, 
  Send,
  Clock,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  User,
  UserPlus
} from "lucide-react";

export const OwnersList = React.memo(() => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    active: 0,
    suspended: 0,
    disabled: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 24,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status Action Modal State
  const [statusModalOwner, setStatusModalOwner] = useState(null);
  const [pendingStatusAction, setPendingStatusAction] = useState(""); // "active" | "suspended"
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Reset Password Modal State
  const [resetModalOwner, setResetModalOwner] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);

  // Manual WhatsApp Modal State
  const [whatsAppModalOwner, setWhatsAppModalOwner] = useState(null);

  // Debounce search input
  const debounceTimerRef = useRef(null);
  const handleSearchChange = (val) => {
    setSearch(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
  };

  const fetchOwners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);

      const response = await api.get(`/api/admin/owners?${params.toString()}`);
      if (response.data.success) {
        setData(response.data.data || response.data.owners || []);
        if (response.data.counts) {
          setCounts(response.data.counts);
        }
        if (response.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: response.data.pagination.total || 0,
            totalPages: response.data.pagination.totalPages || 1,
          }));
        }
      } else {
        setError(response.data.message || "Failed to fetch owners");
      }
    } catch (err) {
      console.error("Error fetching owners:", err);
      setError(err.response?.data?.message || err.message || "Failed to load owners");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  const handleStatusFilterClick = (status) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Status toggle handler
  const handleStatusConfirm = async () => {
    if (!statusModalOwner || !pendingStatusAction) return;
    const ownerId = statusModalOwner.id || statusModalOwner._id;
    setIsUpdatingStatus(true);
    const toastId = toast.loading(`Updating owner status to ${pendingStatusAction}...`);
    try {
      const res = await api.put(`/api/admin/owners/${ownerId}/status`, { status: pendingStatusAction });
      if (res.data.success) {
        toast.success(`Owner status updated to ${pendingStatusAction}`, { id: toastId });
        setStatusModalOwner(null);
        fetchOwners();
      } else {
        toast.error(res.data.message || "Status update failed", { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Status update failed", { id: toastId });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Reset password handler
  const handleResetPasswordExecute = async () => {
    if (!resetModalOwner) return;
    const ownerId = resetModalOwner.id || resetModalOwner._id;
    setIsResetting(true);
    const toastId = toast.loading("Generating secure temporary credentials...");
    try {
      const res = await api.post(`/api/admin/owners/${ownerId}/reset-password`);
      if (res.data.success) {
        toast.success("Temporary password generated securely", { id: toastId });
        setResetResult(res.data);
      } else {
        toast.error(res.data.message || "Password reset failed", { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Password reset failed", { id: toastId });
    } finally {
      setIsResetting(false);
    }
  };

  // Copy credentials helper
  const handleCopyCredentials = () => {
    if (!resetResult?.credentials) return;
    const creds = resetResult.credentials;
    const text = `HostelMate Portal Login Credentials\nURL: ${creds.loginUrl || resetResult.loginUrl}\nUsername / Phone: ${creds.username || resetModalOwner.phone}\nTemporary Password: ${creds.tempPassword || creds.temporaryPassword}\n\nNote: You will be required to create a new password on your first login.`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    toast.success("Credentials copied to clipboard!");
    setTimeout(() => setCopiedCreds(false), 3000);
  };

  // Send credentials via WhatsApp handler
  const handleSendViaWhatsApp = async () => {
    if (!resetModalOwner) return;
    const ownerId = resetModalOwner.id || resetModalOwner._id;
    setSendingWhatsapp(true);
    const toastId = toast.loading("Dispatching credentials via WhatsApp...");
    try {
      const res = await api.post(`/api/admin/owners/${ownerId}/send-credentials`);
      if (res.data.success) {
        toast.success(res.data.message || "Credentials sent via WhatsApp!", { id: toastId });
      } else if (res.data.unconfigured) {
        toast.error("WhatsApp gateway unconfigured. Opening manual chat window...", { id: toastId });
        openManualWhatsApp(resetModalOwner, resetResult?.credentials?.tempPassword);
      } else {
        toast.error(res.data.message || "Failed to send WhatsApp message", { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send WhatsApp message", { id: toastId });
    } finally {
      setSendingWhatsapp(false);
    }
  };

  const openManualWhatsApp = (owner, tempPwd = null) => {
    const rawPhone = String(owner.phone || "").replace(/[^0-9]/g, "");
    const phoneWithCode = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const frontendBase = window.location.origin || "https://hostelmate-saas.vercel.app";
    let message = `Hello ${owner.name || owner.ownerName || "Owner"}, greetings from HostelMate Enterprise!`;
    if (tempPwd) {
      message += `\nYour temporary password has been reset: ${tempPwd}\nLogin Portal: ${frontendBase}/owner/login`;
    }
    const url = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const statusPills = [
    { key: "all", label: "All Owners", count: counts.all },
    { key: "active", label: "Active", count: counts.active },
    { key: "suspended", label: "Suspended", count: counts.suspended },
    { key: "disabled", label: "Disabled", count: counts.disabled },
  ];

  return (
    <PageContainer>
      <SectionHeader 
        title="Owners CRM" 
        subtitle="Manage client owner accounts, verify identities, inspect linked hostels, and dispatch secure communications" 
      />

      {/* 1. STATUS FILTER PILLS WITH COUNTS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin">
        {statusPills.map((pill) => {
          const isActive = statusFilter === pill.key;
          return (
            <button
              key={pill.key}
              onClick={() => handleStatusFilterClick(pill.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 border cursor-pointer ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm"
                  : "bg-slate-900/60 text-slate-400 border-white/5 hover:border-white/15 hover:text-white"
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-white/5 text-slate-400"
                }`}
              >
                {pill.count ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. SEARCH & CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchBar 
          value={search}
          placeholder="Search owners by name, phone, email, hostel name, city, district..." 
          onChange={handleSearchChange} 
        />
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate("/admin/owners/new")}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-500/20 min-h-[44px]"
            title="Create new owner registration request"
          >
            <UserPlus size={15} />
            <span>Register Owner</span>
          </button>
          <button
            onClick={fetchOwners}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-white/5 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 min-h-[44px]"
            title="Refresh owners CRM"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-emerald-400" : "text-emerald-400"} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3. OWNERS CARDS GRID */}
      <ContentContainer>
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={28} className="animate-spin text-emerald-400" />
            <span>Loading owners CRM data...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
            <p className="font-semibold mb-2">{error}</p>
            <button
              onClick={fetchOwners}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition"
            >
              Retry
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="p-16 text-center text-slate-400 border border-white/5 bg-white/[0.02] rounded-2xl flex flex-col items-center justify-center">
            <User size={36} className="mx-auto mb-3 text-slate-500" />
            <h3 className="text-base font-bold text-white mb-1">No Owners Found</h3>
            <p className="text-xs text-slate-400 mb-4 max-w-md">
              {debouncedSearch || statusFilter !== "all"
                ? "No owner accounts match your current search or status filter."
                : "No owner accounts registered in the database. Create a new owner registration request to get started."}
            </p>
            <button
              onClick={() => navigate("/admin/owners/new")}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <UserPlus size={16} />
              <span>Register New Owner</span>
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {data.map((owner) => {
                const ownerId = owner.id || owner._id;
                const ownerName = owner.name || owner.ownerName || "Unnamed Owner";
                const isSuspended = owner.status === "suspended" || owner.status === "disabled";
                const linkedHostel = owner.hostelDetails || {};
                const hostelId = linkedHostel.hostelId || owner.hostelId;
                const hostelName = linkedHostel.hostelName || owner.hostel || "N/A";
                const locationStr = [owner.city, owner.district, owner.state].filter(Boolean).join(", ") || owner.address || "Not provided";
                const photoSrc = owner.photo || owner.profileImage || "";
                const idInfo = owner.identity || {};

                return (
                  <div 
                    key={ownerId} 
                    className="bg-[#0B1220] border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col shadow-lg group"
                  >
                    {/* Header: Photo, Name, Status */}
                    <div className="p-5 flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-13 h-13 rounded-2xl border border-white/10 bg-slate-800 text-emerald-400 flex items-center justify-center font-black text-lg shrink-0 overflow-hidden shadow-inner">
                            {photoSrc ? (
                              <img 
                                src={photoSrc} 
                                alt={ownerName} 
                                className="w-full h-full object-cover" 
                                onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
                              />
                            ) : (
                              ownerName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-white leading-tight group-hover:text-emerald-400 transition">
                              {ownerName}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                              <Phone size={12} className="text-slate-500 shrink-0" />
                              <span className="text-slate-300 font-medium">{owner.phone || "No phone"}</span>
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={owner.status || "active"} />
                      </div>

                      {/* Email & Address */}
                      <div className="space-y-1.5 text-xs text-slate-300 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2 truncate">
                          <Mail size={12} className="text-slate-500 shrink-0" />
                          <span className="text-[11px] text-slate-300 truncate">{owner.email || "No email provided"}</span>
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <MapPin size={12} className="text-slate-500 shrink-0" />
                          <span className="text-[11px] text-slate-400 truncate">{locationStr}</span>
                        </div>
                        {idInfo.idNumber && (
                          <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-[11px]">
                            <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
                            <span className="text-slate-400">Identity:</span>
                            <span className="font-mono text-emerald-300 font-semibold">{idInfo.idNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Linked Hostel Card Section */}
                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-white truncate max-w-[190px]">
                            <Building size={14} className="text-blue-400 shrink-0" />
                            <span className="truncate">{hostelName}</span>
                          </div>
                          {hostelId && (
                            <button
                              onClick={() => navigate(`/admin/hostels/${hostelId}/overview`)}
                              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-0.5 transition cursor-pointer"
                              title="View Hostel Overview"
                            >
                              <span>View Hostel</span>
                              <ExternalLink size={10} />
                            </button>
                          )}
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Residents</p>
                            <p className="text-xs font-black text-white mt-0.5">{owner.residentCount ?? 0}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Occupancy</p>
                            <p className="text-xs font-black text-emerald-400 mt-0.5">{owner.occupancyPercent ?? 0}%</p>
                          </div>
                          <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">MRR</p>
                            <p className="text-xs font-black text-white mt-0.5">₹{owner.monthlyRevenue ?? 0}</p>
                          </div>
                        </div>

                        {/* Plan & Expiry */}
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="font-semibold text-slate-400">{owner.planName || "HostelMate Unified Plan"}</span>
                          <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 text-[10px]">
                            {owner.daysRemaining ?? 0} Days Left
                          </span>
                        </div>
                      </div>

                      {/* Password / Login Status Pill */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <div className="flex items-center gap-1.5">
                          <KeyRound size={11} className="text-slate-500" />
                          <span>
                            {owner.firstLogin ? "First Login: Pending" : "First Login: Completed"}
                          </span>
                        </div>
                        {owner.mustChangePassword && (
                          <span className="text-amber-400 font-semibold">Temp Password Active</span>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="p-3 bg-black/30 border-t border-white/5 grid grid-cols-3 gap-2">
                      {/* WhatsApp Button */}
                      <button
                        onClick={() => openManualWhatsApp(owner)}
                        className="py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition active:scale-[0.98] cursor-pointer"
                        title="Send WhatsApp Message"
                      >
                        <MessageSquare size={13} />
                        <span>WhatsApp</span>
                      </button>

                      {/* Reset Password Button */}
                      <button
                        onClick={() => {
                          setResetModalOwner(owner);
                          setResetResult(null);
                        }}
                        className="py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition active:scale-[0.98] cursor-pointer"
                        title="Reset Owner Password"
                      >
                        <KeyRound size={13} />
                        <span>Reset Pwd</span>
                      </button>

                      {/* Suspend / Activate Toggle Button */}
                      {isSuspended ? (
                        <button
                          onClick={() => {
                            setStatusModalOwner(owner);
                            setPendingStatusAction("active");
                          }}
                          className="py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition active:scale-[0.98] cursor-pointer"
                          title="Activate Account"
                        >
                          <Play size={13} />
                          <span>Activate</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setStatusModalOwner(owner);
                            setPendingStatusAction("suspended");
                          }}
                          className="py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition active:scale-[0.98] cursor-pointer"
                          title="Suspend Account"
                        >
                          <Pause size={13} />
                          <span>Suspend</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 mt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-bold text-white px-2">{pagination.page}</span>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </ContentContainer>

      {/* 4. STATUS CONFIRMATION MODAL */}
      {statusModalOwner && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  pendingStatusAction === "active"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                }`}>
                  {pendingStatusAction === "active" ? <Play size={20} /> : <Pause size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {pendingStatusAction === "active" ? "Activate Owner Account" : "Suspend Owner Account"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Account Status Transition</p>
                </div>
              </div>
              <button 
                onClick={() => !isUpdatingStatus && setStatusModalOwner(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                disabled={isUpdatingStatus}
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to change the status of <strong className="text-white">{statusModalOwner.name || statusModalOwner.ownerName}</strong> to <span className="uppercase font-bold text-white">{pendingStatusAction}</span>?
            </p>

            {pendingStatusAction === "suspended" && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 leading-relaxed">
                <strong>Session Termination:</strong> Suspending this owner will automatically revoke all their active browser and mobile sessions immediately.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setStatusModalOwner(null)}
                disabled={isUpdatingStatus}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 border border-white/10 hover:bg-white/5 transition cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleStatusConfirm}
                disabled={isUpdatingStatus}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer min-h-[44px] ${
                  pendingStatusAction === "active"
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/30"
                    : "bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/30"
                }`}
              >
                {isUpdatingStatus ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <span>Confirm {pendingStatusAction === "active" ? "Activation" : "Suspension"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. RESET PASSWORD MODAL */}
      {resetModalOwner && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Reset Owner Password</h3>
                  <p className="text-xs text-amber-400 mt-0.5">Secure Single-Use Credential Generation</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setResetModalOwner(null);
                  setResetResult(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                disabled={isResetting}
              >
                <X size={18} />
              </button>
            </div>

            {!resetResult ? (
              <>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Reset password for <strong className="text-white">{resetModalOwner.name || resetModalOwner.ownerName}</strong> ({resetModalOwner.phone})?
                </p>

                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 leading-relaxed space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldAlert size={14} className="shrink-0" /> Security Protocol
                  </p>
                  <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5 pl-1">
                    <li>Revokes all existing active owner login sessions immediately.</li>
                    <li>Generates a fresh temporary password and stores only a secure bcrypt hash.</li>
                    <li>Requires the owner to change their password upon their next login.</li>
                    <li>The temporary password will only be visible to you once in this window.</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setResetModalOwner(null)}
                    disabled={isResetting}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 border border-white/10 hover:bg-white/5 transition cursor-pointer min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleResetPasswordExecute}
                    disabled={isResetting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-900/30 min-h-[44px]"
                  >
                    {isResetting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Generating Credentials...
                      </>
                    ) : (
                      <>
                        <KeyRound size={14} />
                        Generate Temp Password
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                  <p className="font-bold mb-1">Temporary Password Generated Successfully</p>
                  <p className="text-slate-300 text-[11px]">
                    Share these credentials securely with the owner. The temporary password will NOT be shown again.
                  </p>
                </div>

                <div className="p-4 bg-black/60 border border-white/10 rounded-xl space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Login URL:</span>
                    <span className="text-blue-400 font-sans text-[11px] truncate max-w-[240px]">
                      {resetResult.credentials?.loginUrl || `${window.location.origin}/owner/login`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Username:</span>
                    <span className="text-white font-bold">{resetResult.credentials?.username || resetModalOwner.phone}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-white/10">
                    <span>Temp Password:</span>
                    <span className="text-emerald-400 font-black text-sm select-all">
                      {resetResult.credentials?.tempPassword || resetResult.credentials?.temporaryPassword}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleCopyCredentials}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-white/10 transition flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    {copiedCreds ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedCreds ? "Copied!" : "Copy Credentials"}</span>
                  </button>

                  <button
                    onClick={handleSendViaWhatsApp}
                    disabled={sendingWhatsapp}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30 min-h-[44px]"
                  >
                    {sendingWhatsapp ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Send via WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setResetModalOwner(null);
                      setResetResult(null);
                      fetchOwners();
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
});

export default OwnersList;
