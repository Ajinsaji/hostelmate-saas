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
import { Download, Eye, ChevronDown } from "lucide-react";


export const HostelsList = React.memo(() => {
  const navigate = useNavigate();
  const { data: hostels, loading, pagination } = useHostels();

  // State management
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

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

  
  // Column visibility settings
  const [visibleColumns, setVisibleColumns] = useState({
    logo: true,
    name: true,
    owner: true,
    plan: true,
    status: true,
    residents: true,
    occupancy: true,
    revenue: true,
    healthScore: true,
    lastLogin: true,
    createdDate: true,
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

  // Advanced Filtering & Search
  const filteredHostels = useMemo(() => {
    const list = Array.isArray(hostels) ? hostels : [];
    if (!list.length) return [];

    const toLower = (v) => String(v ?? "").toLowerCase();

    const normalizeOccupancy = (v) => {
      // supports values like "85%" or numbers
      if (typeof v === "number") return v;
      const n = String(v ?? "").replace(/[^0-9.]/g, "");
      const parsed = parseFloat(n);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const normalizeNumber = (v) => {
      const n = String(v ?? "").replace(/[^0-9]/g, "");
      const parsed = parseInt(n, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const matchesGlobalSearch = (h) => {
      if (!search) return true;
      const q = toLower(search);
      return (
        toLower(h.name).includes(q) ||
        toLower(h.owner).includes(q) ||
        toLower(h.city).includes(q) ||
        toLower(h.district).includes(q) ||
        toLower(h.state).includes(q) ||
        toLower(h.hostelCode).includes(q) ||
        toLower(h.email).includes(q) ||
        toLower(h.phone).includes(q)
      );
    };

    const matchesAdvancedFilters = (h) => {
      if (filters.status && h.status !== filters.status) return false;
      if (filters.plan && h.plan !== filters.plan) return false;
      if (filters.city && h.city !== filters.city) return false;
      if (filters.district && h.district !== filters.district) return false;
      if (filters.state && h.state !== filters.state) return false;
      if (filters.subscription && h.subscription !== filters.subscription) return false;

      if (filters.residentCount) {
        const n = normalizeNumber(h.residents);
        if (String(n) !== String(filters.residentCount)) return false;
      }

      if (filters.occupancy) {
        const o = normalizeOccupancy(h.occupancy);
        if (String(o) !== String(filters.occupancy)) return false;
      }

      if (filters.healthScore) {
        const hs = normalizeNumber(h.healthScore);
        if (String(hs) !== String(filters.healthScore)) return false;
      }

      if (filters.createdDate) {
        if (String(h.createdDate) !== String(filters.createdDate)) return false;
      }

      if (filters.lastLogin) {
        if (String(h.lastLogin) !== String(filters.lastLogin)) return false;
      }

      return true;
    };

    const sorted = list
      .filter((h) => matchesGlobalSearch(h) && matchesAdvancedFilters(h))
      .sort((a, b) => {
        let valA = a?.[sortField];
        let valB = b?.[sortField];

        if (sortField === "healthScore") {
          valA = normalizeNumber(valA);
          valB = normalizeNumber(valB);
        }
        if (sortField === "residents") {
          valA = normalizeNumber(valA);
          valB = normalizeNumber(valB);
        }
        if (sortField === "occupancy") {
          valA = normalizeOccupancy(valA);
          valB = normalizeOccupancy(valB);
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });

    return sorted;
  }, [hostels, search, filters, sortField, sortOrder]);


  // Bulk executions
  const handleBulkAction = (action) => {
    alert(`Initiating Bulk Action: [${action}] on selected hostels: ${selectedIds.join(", ")}`);
    setSelectedIds([]);
    setBulkDrawerOpen(false);
  };

  // Export handlers
  const handleExport = (type) => {
    alert(`Simulating dynamic export of current list to ${type.toUpperCase()} file...`);
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

      {/* Grid Table */}
      <ContentContainer>
        <SaaSTable 
          headers={[]} // passed custom column render
          data={filteredHostels}
          loading={loading}
          renderRow={(row, idx) => {
            const isSelected = selectedIds.includes(row.id);
            return (
              <tr 
                key={row.id || idx} 
                onClick={() => navigate(`/admin/hostels/${row.id}`)}
                className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition cursor-pointer select-none"
              >
                <td className="px-4 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={(e) => handleSelectRow(e, row.id)}
                    className="rounded border-white/10 text-emerald-500 focus:ring-0 bg-transparent cursor-pointer"
                  />
                </td>
                
                {visibleColumns.logo && (
                  <td className="px-4 py-4">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                      style={{ background: COLORS.surfaceLight, color: COLORS.primaryLight }}
                    >
                      {row.logo}
                    </div>
                  </td>
                )}

                {visibleColumns.name && (
                  <td className="px-4 py-4">
                    <p className="text-xs font-bold text-white">{row.name}</p>
                    <p className="text-[10px] text-slate-400">{row.city}, {row.state}</p>
                  </td>
                )}

                {visibleColumns.owner && (
                  <td className="px-4 py-4 text-xs text-slate-300">{row.owner}</td>
                )}

                {visibleColumns.plan && (
                  <td className="px-4 py-4 text-xs font-bold text-slate-400">{row.plan}</td>
                )}

                {visibleColumns.status && (
                  <td className="px-4 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                )}

                {visibleColumns.residents && (
                  <td className="px-4 py-4 text-xs text-slate-400">{row.residents}</td>
                )}

                {visibleColumns.occupancy && (
                  <td className="px-4 py-4 text-xs text-slate-400">
                    {(() => {
                      const o = row.occupancy;
                      if (o && typeof o === "object") {
                        const total = o?.totalBeds;
                        const occupied = o?.occupiedBeds;
                        const vacant = o?.vacantBeds;
                        if ([total, occupied, vacant].every((v) => typeof v === "number")) {
                          return `${occupied}/${total}`;
                        }
                        return `${o?.occupiedBeds ?? ""}/${o?.totalBeds ?? ""}`.trim();
                      }
                      return o;
                    })()}
                  </td>
                )}

                {visibleColumns.revenue && (
                  <td className="px-4 py-4 text-xs font-bold text-emerald-400">{row.revenue}</td>
                )}

                {visibleColumns.healthScore && (
                  <td className="px-4 py-4 text-xs">
                    <span 
                      className="font-bold text-[10px] px-2 py-0.5 rounded border"
                      style={{ 
                        color: row.healthScore > 80 ? COLORS.success : COLORS.warning,
                        borderColor: row.healthScore > 80 ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)"
                      }}
                    >
                      {row.healthScore}/100
                    </span>
                  </td>
                )}

                {visibleColumns.lastLogin && (
                  <td className="px-4 py-4 text-[10px] text-slate-400">{row.lastLogin}</td>
                )}

                {visibleColumns.createdDate && (
                  <td className="px-4 py-4 text-[10px] text-slate-500">{row.createdDate}</td>
                )}

                {visibleColumns.actions && (
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => navigate(`/admin/hostels/${row.id}`)}
                      className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition"
                    >
                      <Eye size={12} />
                    </button>
                  </td>
                )}
              </tr>
            );
          }}
        />
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
