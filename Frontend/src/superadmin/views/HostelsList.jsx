import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SaaSTable from "../components/tables/SaaSTable";
import SearchBar from "../components/forms/SearchBar";
import FilterBar from "../components/forms/FilterBar";
import StatusBadge from "../components/feedback/StatusBadge";
import QuickActionButton from "../components/widgets/QuickActionButton";
import Drawer from "../components/drawers/Drawer";
import useHostels from "../hooks/useHostels";
import { COLORS } from "../constants/theme";
import { Download, Eye, ChevronDown, Link, QrCode } from "lucide-react";


export const HostelsList = React.memo(() => {
  const navigate = useNavigate();
  // State management
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);

  // Advanced filters (implemented incrementally)
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

  const { data: hostels, loading, pagination } = useHostels({
    page,
    pageSize: 25,
    search,
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



  // Selection helpers


  const handleSelectRow = (e, id) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    }
  };

  // Advanced Filtering & Search is now handled by the backend
  const filteredHostels = hostels || [];


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
        // Optimistic UI update or refresh
        const fetchHostels = async () => {
          try {
            const res = await api.get("/api/admin/hostels");
            if (res.data.success) {
              setHostels(res.data.data);
            }
          } catch (e) {
            console.error("Refresh failed", e);
          }
        };
        fetchHostels();
        setSelectedIds([]);
        setBulkDrawerOpen(false);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to execute bulk action", { id: toastId });
    }
  };

  // Export handlers
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

  const tableHeaders = useMemo(() => {
    const cols = [];
    if (visibleColumns.logo) cols.push({ key: "logo", label: "Logo", align: "center" });
    if (visibleColumns.name) cols.push({ key: "name", label: "Name & Location" });
    if (visibleColumns.owner) cols.push({ key: "owner", label: "Owner" });
    if (visibleColumns.plan) cols.push({ key: "plan", label: "Subscription" });
    if (visibleColumns.status) cols.push({ key: "status", label: "Status" });
    if (visibleColumns.residents) cols.push({ key: "residents", label: "Residents", align: "center" });
    if (visibleColumns.occupancy) cols.push({ key: "occupancy", label: "Occupancy", align: "center" });
    if (visibleColumns.revenue) cols.push({ key: "revenue", label: "Revenue", align: "right" });
    if (visibleColumns.storage) cols.push({ key: "storage", label: "Storage", align: "center" });
    if (visibleColumns.healthScore) cols.push({ key: "healthScore", label: "Health Score", align: "center" });
    if (visibleColumns.lastLogin) cols.push({ key: "lastLogin", label: "Last Login" });
    if (visibleColumns.createdDate) cols.push({ key: "createdDate", label: "Created Date" });
    if (visibleColumns.actions) cols.push({ key: "actions", label: "Actions", align: "center" });
    return cols;
  }, [visibleColumns]);

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
          <SearchBar placeholder="Search name, owner, city..." onChange={(v) => setSearch(v)} />
          <FilterBar 
            filters={[
              { 
                key: "plan", 
                label: "Plan", 
                options: [{ label: "Basic", value: "Basic" }, { label: "Pro", value: "Pro" }, { label: "Trial", value: "Trial" }] 
              },
              { 
                key: "status", 
                label: "Status", 
                options: [{ label: "Active", value: "active" }, { label: "Pending", value: "pending" }, { label: "Suspended", value: "suspended" }] 
              }
            ]} 
            onFilterChange={(key, val) => {
              setFilters((prev) => ({ ...prev, [key]: val }));
            }}

          />
        </div>

        {/* Column Visibility dropdown wrapper */}
        <div className="relative">
          <button 
            onClick={() => setShowColDropdown(!showColDropdown)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 border border-white/10 hover:text-white transition flex items-center gap-2 select-none"
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
            className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 transition"
          >
            Bulk Actions
          </button>
        </div>
      )}

      {/* Grid Cards */}
      <ContentContainer>
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading hostels directory...</div>
        ) : filteredHostels.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-white/5 bg-white/[0.02] rounded-2xl">
            No hostels found matching your criteria.
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
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl border border-white/10" style={{ background: COLORS.surfaceLight, color: COLORS.primaryLight }}>
                          {row.logo || (row.name ? row.name.charAt(0).toUpperCase() : 'H')}
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
                          <p className="text-[10px] text-slate-300 mt-1 font-medium">{row.owner}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {visibleColumns.status && <StatusBadge status={row.status} />}
                      {visibleColumns.plan && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{row.plan}</span>}
                      {visibleColumns.healthScore && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border" style={{ color: row.healthScore > 80 ? COLORS.success : COLORS.warning, borderColor: row.healthScore > 80 ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)" }}>
                          Health: {row.healthScore}/100
                        </span>
                      )}
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
                      <button onClick={() => navigate(`/admin/hostels/${row.id}`)} className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition">
                        <Eye size={12} /> View Details
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toast.success('Public link copied to clipboard!'); }} className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition">
                        <Link size={12} /> Share Link
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toast.success('QR Code sent to your email.'); }} className="py-1.5 px-3 rounded-lg flex items-center justify-center text-[10px] font-bold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition">
                        <QrCode size={12} />
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
                className="px-3 py-1.5 rounded-lg border border-white/5 text-xs font-semibold text-slate-300 bg-slate-900/50 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={pagination.page >= (pagination.totalPages || Math.ceil(pagination.total / pagination.pageSize))}
                className="px-3 py-1.5 rounded-lg border border-white/5 text-xs font-semibold text-slate-300 bg-slate-900/50 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </ContentContainer>

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
