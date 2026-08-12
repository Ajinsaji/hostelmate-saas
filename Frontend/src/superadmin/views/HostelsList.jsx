import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SearchBar from "../components/forms/SearchBar";
import FilterBar from "../components/forms/FilterBar";
import StatusBadge from "../components/feedback/StatusBadge";
import QuickActionButton from "../components/widgets/QuickActionButton";
import Drawer from "../components/drawers/Drawer";
import useHostels from "../hooks/useHostels";
import { COLORS } from "../constants/theme";
import { Download, Eye, ChevronDown, Link, QrCode, Trash2, AlertTriangle, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../services/api";

export const HostelsList = React.memo(() => {
  const navigate = useNavigate();
  // State management
  const [rawSearch, setRawSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);

  // Soft delete modal state
  const [removeModalHostel, setRemoveModalHostel] = useState(null);
  const [confirmNameInput, setConfirmNameInput] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);

  // Search input debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(rawSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [rawSearch]);

  // Advanced filters
  const [filters, setFilters] = useState({
    status: "",
    plan: "",
    city: "",
    district: "",
    state: "",
    subscription: "",
    residentCount: "",
    occupancy: "",
    healthScore: "",
    createdDate: "",
    lastLogin: "",
  });

  const { data: hostels, loading, pagination, refetch } = useHostels({
    page,
    pageSize: 25,
    search: debouncedSearch,
    sortField,
    sortOrder,
    filters
  });

  const [visibleColumns, setVisibleColumns] = useState({
    logo: true,
    name: true,
    owner: true,
    plan: true,
    status: true,
    residents: true,
    occupancy: true,
    revenue: true,
    storage: true,
    healthScore: true,
    lastLogin: false,
    createdDate: false,
    actions: true
  });
  
  const [showColDropdown, setShowColDropdown] = useState(false);
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);

  const handleSelectRow = (e, id) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    }
  };

  const filteredHostels = hostels || [];

  const handleRemoveHostel = async () => {
    if (!removeModalHostel) return;
    const expectedName = (removeModalHostel.name || removeModalHostel.hostelName || "").trim();
    if (confirmNameInput.trim() !== expectedName) {
      return toast.error("Hostel name does not match exact confirmation string");
    }

    setIsRemoving(true);
    const toastId = toast.loading(`Moving ${expectedName} to 60-day Trash...`);

    try {
      const res = await api.delete(`/api/admin/hostels/${removeModalHostel.id || removeModalHostel._id}`);
      if (res.data?.success) {
        toast.success(res.data.message || "Hostel moved to Trash. Retained for 60 days.", { id: toastId });
        setRemoveModalHostel(null);
        setConfirmNameInput("");
        refetch();
      } else {
        toast.error(res.data?.message || "Failed to remove hostel", { id: toastId });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove hostel", { id: toastId });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) {
      return toast.error("Please select at least one hostel.");
    }
    const toastId = toast.loading(`Executing bulk action '${action}'...`);
    try {
      const response = await api.post("/api/admin/hostels/bulk-action", {
        action,
        hostelIds: selectedIds
      });
      if (response.data.success) {
        toast.success(response.data.message, { id: toastId });
        setPage(1);
        setSelectedIds([]);
        setBulkDrawerOpen(false);
        refetch();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to execute bulk action", { id: toastId });
    }
  };

  const handleExport = async (type) => {
    const toastId = toast.loading(`Generating ${type.toUpperCase()} export...`);
    try {
      const res = await api.post("/api/admin/reports/generate", { reportType: "operational", format: type }, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: type === 'pdf' ? 'application/pdf' : type === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HostelMate_Operational_Report.${type === 'excel' ? 'xlsx' : type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} export downloaded`, { id: toastId });
    } catch (e) {
      toast.error(`Failed to export ${type.toUpperCase()}`, { id: toastId });
    }
  };

  return (
    <PageContainer>
      <SectionHeader 
        title="Hostels Registry"
        subtitle="Manage SaaS client subscriptions and operational CRM profiles"
        actions={
          <div className="flex gap-2">
            <QuickActionButton label="Export CSV" icon={<Download size={14} />} variant="secondary" onClick={() => handleExport("csv")} />
            <QuickActionButton label="Export PDF" icon={<Download size={14} />} variant="secondary" onClick={() => handleExport("pdf")} />
          </div>
        }
      />

      {/* Toolbar Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 z-10 relative">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <SearchBar placeholder="Search name, owner, phone, city, address, pincode..." value={rawSearch} onChange={(v) => setRawSearch(v)} />
          <FilterBar 
            filters={[
              { 
                key: "plan", 
                label: "All Plans", 
                options: [
                  { label: "All Plans", value: "" },
                  { label: "Basic", value: "Basic" },
                  { label: "Pro", value: "Pro" },
                  { label: "Trial", value: "Trial" }
                ] 
              },
              { 
                key: "status", 
                label: "All Statuses", 
                options: [
                  { label: "All Statuses", value: "" },
                  { label: "Active", value: "active" },
                  { label: "Trial", value: "trial" },
                  { label: "Suspended", value: "suspended" },
                  { label: "Expired", value: "expired" },
                  { label: "Pending", value: "pending" }
                ] 
              }
            ]} 
            selectedValues={filters}
            onFilterChange={(key, val) => {
              setPage(1);
              setFilters((prev) => ({ ...prev, [key]: val }));
            }}
          />
        </div>

        {/* Column Visibility dropdown wrapper */}
        <div className="relative">
          <button 
            onClick={() => setShowColDropdown(!showColDropdown)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 border border-white/10 hover:text-white transition flex items-center gap-2 select-none cursor-pointer"
            style={{ background: COLORS.surfaceLight }}
          >
            Columns
            <ChevronDown size={14} />
          </button>
          {showColDropdown && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border p-3 space-y-2 shadow-2xl z-20" style={{ background: COLORS.surfaceLight, borderColor: COLORS.border }}>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Visible Columns</p>
              {Object.keys(visibleColumns).map((col) => (
                <label key={col} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={visibleColumns[col]} 
                    onChange={(e) => setVisibleColumns({ ...visibleColumns, [col]: e.target.checked })}
                    className="rounded border-white/10 text-emerald-500 focus:ring-0 bg-transparent"
                  />
                  <span className="capitalize">{col.replace(/([A-Z])/g, ' $1')}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Action Bar Drawer trigger */}
      {selectedIds.length > 0 && (
        <div 
          className="p-4 rounded-xl border flex items-center justify-between gap-4 mb-6 animate-fade-in"
          style={{ background: "rgba(15, 122, 94, 0.1)", borderColor: "rgba(16, 185, 129, 0.2)" }}
        >
          <span className="text-xs font-bold text-emerald-400">{selectedIds.length} Hostels Selected</span>
          <button 
            onClick={() => setBulkDrawerOpen(true)}
            className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 transition cursor-pointer"
          >
            Bulk Actions
          </button>
        </div>
      )}

      {/* Grid Cards */}
      <ContentContainer>
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin text-emerald-400" />
            <span>Loading hostels directory...</span>
          </div>
        ) : filteredHostels.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-white/5 bg-white/[0.02] rounded-2xl flex flex-col items-center gap-3">
            <p className="text-sm font-semibold">No hostels found matching your criteria.</p>
            {(rawSearch || filters.plan || filters.status) && (
              <button 
                onClick={() => { setRawSearch(""); setFilters({ status: "", plan: "" }); setPage(1); }}
                className="px-4 py-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition cursor-pointer"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredHostels.map((row) => {
              const isSelected = selectedIds.includes(row.id);
              
              let occupancyText = row.occupancy;
              if (row.occupancy && typeof row.occupancy === "object") {
                const total = row.occupancy?.totalBeds;
                const occupied = row.occupancy?.occupiedBeds;
                if (typeof total === "number" && typeof occupied === "number") {
                  occupancyText = `${occupied}/${total}`;
                } else {
                  occupancyText = `${row.occupancy?.occupiedBeds ?? ""}/${row.occupancy?.totalBeds ?? ""}`.trim();
                }
              }

              return (
                <div 
                  key={row.id} 
                  onClick={() => navigate(`/admin/hostels/${row.id}`)}
                  className={`bg-slate-900/50 border rounded-2xl overflow-hidden hover:border-emerald-500/30 transition flex flex-col relative group cursor-pointer ${isSelected ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5'}`}
                >
                  <div className="p-5 flex-1 relative">
                    <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(e, row.id)}
                        className="rounded border-white/10 text-emerald-500 focus:ring-0 bg-transparent cursor-pointer w-5 h-5"
                      />
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      {visibleColumns.logo && (
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl border border-white/10 overflow-hidden shrink-0" style={{ background: COLORS.surfaceLight, color: COLORS.primaryLight }}>
                          {row.ownerPhoto ? (
                            <img 
                              src={row.ownerPhoto} 
                              alt={row.name} 
                              className="w-full h-full object-cover" 
                              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} 
                            />
                          ) : (
                            row.name ? row.name.charAt(0).toUpperCase() : 'H'
                          )}
                        </div>
                      )}
                      <div className="pr-8">
                        {visibleColumns.name && (
                          <>
                            <h3 className="text-sm font-bold text-white leading-tight">{row.name}</h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">{row.city}, {row.state}</p>
                          </>
                        )}
                        {visibleColumns.owner && (
                          <p className="text-[10px] text-slate-300 mt-1 font-medium">Owner: {row.owner || "Not provided"}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {visibleColumns.status && <StatusBadge status={row.status} />}
                      {visibleColumns.plan && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{row.plan}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {visibleColumns.residents && (
                        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Residents</p>
                          <p className="text-sm font-black text-white">{row.residents ?? '0'}</p>
                        </div>
                      )}
                      {visibleColumns.occupancy && (
                        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Occupancy</p>
                          <p className="text-sm font-black text-white">{occupancyText ?? '0'}</p>
                        </div>
                      )}
                      {visibleColumns.revenue && (
                        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Revenue</p>
                          <p className="text-sm font-black text-emerald-400">{row.revenue ?? '₹0'}</p>
                        </div>
                      )}
                      {visibleColumns.storage && (
                        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Storage</p>
                          <p className="text-xs font-bold text-slate-300">{row.storageUsage ?? '0'} / {row.storageLimit ?? '10GB'}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  {visibleColumns.actions && (
                    <div className="p-3 bg-black/20 border-t border-white/5 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => navigate(`/admin/hostels/${row.id}`)} className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition cursor-pointer">
                        <Eye size={12} /> View Details
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toast.success('Public link copied to clipboard!'); }} className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition cursor-pointer">
                        <Link size={12} /> Share Link
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmNameInput("");
                          setRemoveModalHostel(row);
                        }} 
                        className="py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition cursor-pointer"
                        title="Remove Hostel to Trash"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Pagination Controls */}
        {pagination && pagination.total > 0 && (
          <div className="mt-6 flex items-center justify-between px-2">
            <span className="text-xs text-slate-400">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} results
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg border border-white/5 text-xs font-semibold text-slate-300 bg-slate-900/50 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={pagination.page >= (pagination.totalPages || Math.ceil(pagination.total / pagination.pageSize))}
                className="px-3 py-1.5 rounded-lg border border-white/5 text-xs font-semibold text-slate-300 bg-slate-900/50 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </ContentContainer>

      {/* Remove Hostel Modal */}
      {removeModalHostel && (
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
                onClick={() => !isRemoving && setRemoveModalHostel(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                disabled={isRemoving}
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
                <span className="font-bold text-white">{removeModalHostel.name || removeModalHostel.hostelName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Owner Name:</span>
                <span className="font-bold text-white">{removeModalHostel.owner || "Not provided"}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Plan:</span>
                <span className="font-bold text-blue-400">{removeModalHostel.plan || "Basic"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Type <span className="text-rose-400 select-all font-extrabold">{removeModalHostel.name || removeModalHostel.hostelName}</span> to confirm removal:
              </label>
              <input 
                type="text" 
                value={confirmNameInput}
                onChange={(e) => setConfirmNameInput(e.target.value)}
                placeholder={`Type "${removeModalHostel.name || removeModalHostel.hostelName}" here`}
                disabled={isRemoving}
                className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-rose-500 transition min-h-[48px]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setRemoveModalHostel(null)}
                disabled={isRemoving}
                className="px-4 py-3 rounded-xl text-xs font-bold text-slate-300 border border-white/10 hover:bg-white/5 transition min-h-[48px] cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleRemoveHostel}
                disabled={confirmNameInput.trim() !== (removeModalHostel.name || removeModalHostel.hostelName || "").trim() || isRemoving}
                className="px-5 py-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 min-h-[48px] cursor-pointer shadow-lg shadow-rose-900/30"
              >
                {isRemoving ? (
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

      {/* Bulk actions drawer details */}
      <Drawer 
        title="Execute Bulk Operations" 
        isOpen={bulkDrawerOpen} 
        onClose={() => setBulkDrawerOpen(false)}
      >
        <div className="space-y-4 pt-4">
          <p className="text-xs text-slate-400">Apply actions to {selectedIds.length} chosen customer accounts:</p>
          <div className="grid grid-cols-1 gap-2.5">
            <button onClick={() => handleBulkAction("extend")} className="p-3 text-xs font-bold text-left rounded-xl border border-white/5 hover:bg-white/5 text-white transition">Extend Subscription 30 Days</button>
            <button onClick={() => handleBulkAction("suspend")} className="p-3 text-xs font-bold text-left rounded-xl border border-rose-500/10 hover:bg-rose-500/5 text-rose-400 transition">Suspend Accounts</button>
            <button onClick={() => handleBulkAction("activate")} className="p-3 text-xs font-bold text-left rounded-xl border border-white/5 hover:bg-white/5 text-emerald-400 transition">Activate Accounts</button>
            <button onClick={() => handleBulkAction("broadcast")} className="p-3 text-xs font-bold text-left rounded-xl border border-white/5 hover:bg-white/5 text-white transition">Broadcast System Notice</button>
          </div>
        </div>
      </Drawer>
    </PageContainer>
  );
});

export default HostelsList;
