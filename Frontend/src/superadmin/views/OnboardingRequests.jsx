import React, { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../services/api";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SaaSTable from "../components/tables/SaaSTable";
import SearchBar from "../components/forms/SearchBar";
import StatusBadge from "../components/feedback/StatusBadge";
import RegistrationDetailsDrawer from "../components/drawers/RegistrationDetailsDrawer";
import toast from "react-hot-toast";
import { 
  Trash2, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Filter
} from "lucide-react";

export const OnboardingRequests = React.memo(() => {
  const [data, setData] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    activation_pending: 0,
    approved: 0,
    activated: 0,
    rejected: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Remove Request Modal State
  const [removeModalReq, setRemoveModalReq] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Debounce search input (300ms)
  const debounceTimerRef = useRef(null);
  const handleSearchChange = (val) => {
    setSearch(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);

      const response = await api.get(`/api/admin/requests?${params.toString()}`);
      const result = response.data;
      if (result.success) {
        setData(result.requests || result.data || []);
        if (result.counts) {
          setCounts(result.counts);
        }
        if (result.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: result.pagination.total || 0,
            totalPages: result.pagination.totalPages || 1,
          }));
        }
      } else {
        setError(result.message || "Failed to fetch requests");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusFilterClick = (status) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openDrawer = (req) => {
    setSelectedRequest(req);
    setIsDrawerOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!removeModalReq) return;
    const reqId = removeModalReq._id || removeModalReq.id;
    setIsRemoving(true);
    const toastId = toast.loading("Removing registration request...");
    try {
      const res = await api.delete(`/api/admin/requests/${reqId}`);
      if (res.data?.success) {
        toast.success(res.data.message || "Request removed successfully", { id: toastId });
        setRemoveModalReq(null);
        fetchRequests();
      } else {
        toast.error(res.data?.message || "Failed to remove request", { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove request", { id: toastId });
    } finally {
      setIsRemoving(false);
    }
  };

  const statusPills = [
    { key: "all", label: "All Requests", count: counts.all, color: "text-slate-300" },
    { key: "pending", label: "Pending", count: counts.pending, color: "text-rose-400" },
    { key: "activation_pending", label: "Activation Pending", count: counts.activation_pending, color: "text-amber-400" },
    { key: "approved", label: "Approved", count: counts.approved, color: "text-blue-400" },
    { key: "activated", label: "Activated", count: counts.activated, color: "text-emerald-400" },
    { key: "rejected", label: "Rejected", count: counts.rejected, color: "text-rose-500" },
  ];

  const headers = [
    { key: "hostelName", label: "Hostel Name" },
    { key: "ownerName", label: "Owner Name" },
    { key: "phone", label: "Phone / Email" },
    { key: "location", label: "Location" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <PageContainer>
      <SectionHeader 
        title="Onboarding Requests"
        subtitle="Review, approve, activate, or clean up incoming hostel registration requests"
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
          placeholder="Search by hostel name, owner, phone, city, district, email..." 
          onChange={handleSearchChange} 
        />
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-white/5 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shrink-0 disabled:opacity-50 min-h-[44px]"
          title="Refresh requests"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-emerald-400" : "text-emerald-400"} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 3. TABLE / LIST VIEW */}
      <ContentContainer>
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-emerald-400" />
            <span>Loading onboarding requests...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
            <p className="font-semibold mb-2">{error}</p>
            <button
              onClick={fetchRequests}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition"
            >
              Retry
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-white/5 bg-white/[0.02] rounded-2xl">
            <Clock size={32} className="mx-auto mb-2 text-slate-500" />
            <p className="text-sm font-bold text-white mb-1">No Requests Found</p>
            <p className="text-xs text-slate-400">
              {debouncedSearch || statusFilter !== "all"
                ? "Try adjusting your search query or status filter."
                : "There are currently no onboarding registration requests in the queue."}
            </p>
          </div>
        ) : (
          <>
            <SaaSTable 
              headers={headers} 
              data={data}
              renderRow={(row, idx) => {
                const isRejected = String(row.status).toLowerCase() === "rejected";
                return (
                  <tr 
                    key={row._id || idx} 
                    className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.04] transition group"
                  >
                    <td 
                      onClick={() => openDrawer(row)}
                      className="px-6 py-4 text-xs font-bold text-white cursor-pointer"
                    >
                      <div className="font-extrabold text-white group-hover:text-emerald-400 transition">
                        {row.hostelName || "Unnamed Hostel"}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Type: {row.hostelType || "Standard"}
                      </div>
                    </td>

                    <td 
                      onClick={() => openDrawer(row)}
                      className="px-6 py-4 text-xs text-slate-300 cursor-pointer"
                    >
                      {row.ownerName || "Not provided"}
                    </td>

                    <td 
                      onClick={() => openDrawer(row)}
                      className="px-6 py-4 text-xs text-slate-400 cursor-pointer"
                    >
                      <div className="text-slate-300 font-medium">{row.phone || "No phone"}</div>
                      {row.email && (
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{row.email}</div>
                      )}
                    </td>

                    <td 
                      onClick={() => openDrawer(row)}
                      className="px-6 py-4 text-xs text-slate-400 cursor-pointer"
                    >
                      <div>{row.city || "N/A"}</div>
                      {row.district && row.district !== row.city && (
                        <div className="text-[10px] text-slate-500">{row.district}</div>
                      )}
                    </td>

                    <td 
                      onClick={() => openDrawer(row)}
                      className="px-6 py-4 text-xs cursor-pointer"
                    >
                      <StatusBadge status={row.status} />
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawer(row);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>

                        {/* Remove button for rejected or eligible requests */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRemoveModalReq(row);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer border ${
                            isRejected
                              ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
                              : "bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border-white/5 hover:border-rose-500/20"
                          }`}
                          title={isRejected ? "Remove rejected request from list" : "Remove request"}
                        >
                          <Trash2 size={12} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }}
            />

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-bold text-white px-2">{pagination.page}</span>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </ContentContainer>

      {/* 4. DETAILS DRAWER */}
      <RegistrationDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        requestData={selectedRequest}
        onActionComplete={() => {
          setIsDrawerOpen(false);
          fetchRequests();
        }}
      />

      {/* 5. REMOVE REQUEST CONFIRMATION MODAL */}
      {removeModalReq && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Remove Registration Request</h3>
                  <p className="text-xs text-rose-400/80 mt-0.5">Request Queue Cleanup</p>
                </div>
              </div>
              <button 
                onClick={() => !isRemoving && setRemoveModalReq(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                disabled={isRemoving}
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Remove registration request for <strong className="text-white">{removeModalReq.hostelName || "this hostel"}</strong> from the active requests queue?
            </p>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 leading-relaxed space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldAlert size={14} className="shrink-0" /> Data Isolation Guarantee
              </p>
              <p className="text-slate-300">
                This action only deletes this registration request record. Active Hostels, Owners, Subscriptions, Payments, and Residents are strictly preserved and never modified.
              </p>
            </div>

            <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Hostel:</span>
                <span className="font-bold text-white">{removeModalReq.hostelName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Owner:</span>
                <span className="font-bold text-white">{removeModalReq.ownerName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span className="font-bold text-rose-400 capitalize">{removeModalReq.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setRemoveModalReq(null)}
                disabled={isRemoving}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 border border-white/10 hover:bg-white/5 transition cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleRemoveConfirm}
                disabled={isRemoving}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-900/30 min-h-[44px]"
              >
                {isRemoving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Remove Request
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

export default OnboardingRequests;
