import {
  BedDouble,
  Users,
  Wallet,
  FileText,
  Sparkles,
  IndianRupee,
  Plus,
  Building,
  HardDrive,
  AlertTriangle,
  Receipt,
  UserPlus,
  Heart,
  CheckCircle,
  Activity,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../utils/apiClient";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { CardGrid } from "../design-system/layouts/CardGrid";
import { KPICard } from "../design-system/components/KPICard";
import { Card } from "../design-system/components/Card";
import { Button } from "../design-system/components/Button";
import { StatusPill } from "../design-system/components/StatusPill";
import { useTheme } from "../design-system/ThemeProvider";
import { useCurrentHostel } from "../contexts/HostelContext";
import { useFeatureGate } from "../hooks/useFeatureGate";
import WorkspaceActivity from "./WorkspaceActivity";
import WorkspaceInsights from "./WorkspaceInsights";

export default function Dashboard() {
  const { colors, radius, spacing, typography } = useTheme();
  const navigate = useNavigate();
  const { hostel, switchHostel } = useCurrentHostel();
  const { gates, canAccessAnalytics } = useFeatureGate();

  // Local state variables
  const [stats, setStats] = useState({
    residents: 0,
    rooms: 0,
    occupancyRate: 0,
    pendingRent: 0,
    todayCollection: 0,
  });

  const [pendingCount, setPendingCount] = useState(0);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [showAddHostelModal, setShowAddHostelModal] = useState(false);
  const [submittingHostel, setSubmittingHostel] = useState(false);
  const [ownerName, setOwnerName] = useState("Hostel Owner");
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentAdmissions, setRecentAdmissions] = useState([]);

  const [newHostelData, setNewHostelData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    district: "",
    pincode: "",
    hostelType: "Co-Living",
  });

  const activeHostelId = hostel?.id || hostel?._id;

  // Retrieve user name from storage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("ownerUser") || "null");
    if (user?.ownerName) setOwnerName(user.ownerName);
  }, []);

  // Fetch stats based on the selected hostel context
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get("/api/owner/dashboard");
      if (response.data.success) {
        setStats(response.data.stats || {});
        setRecentPayments(response.data.recentPayments || []);
        setRecentAdmissions(response.data.recentAdmissions || []);
      }
    } catch (error) {
      console.warn("Unable to load dashboard stats.", error);
    }
  }, []);

  // Fetch admissions requests count
  const fetchPendingAdmissionsCount = useCallback(async () => {
    try {
      const response = await api.get("/api/owner/admissions/pending");
      if (response.data && response.data.success) {
        setPendingCount(response.data.admissions?.length || 0);
      }
    } catch (err) {
      console.warn("Could not retrieve pending admissions count", err);
    }
  }, []);

  // Fetch Workspace aggregate data
  const fetchWorkspaceOverview = useCallback(async () => {
    try {
      setWorkspaceLoading(true);
      const response = await api.get("/api/v2/workspaces/overview");
      if (response.data && response.data.success) {
        setWorkspaceData(response.data);
      }
    } catch (err) {
      console.warn("Failed to load workspace overview.", err);
    } finally {
      setWorkspaceLoading(false);
    }
  }, []);

  // Reload data whenever active hostel changes in context
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
      fetchWorkspaceOverview();
      fetchPendingAdmissionsCount();
    }, 0);
    return () => clearTimeout(timer);
  }, [activeHostelId, fetchStats, fetchWorkspaceOverview, fetchPendingAdmissionsCount]);

  // Handle Hostel Creation Form Submission
  const handleCreateHostel = async (e) => {
    e.preventDefault();
    if (!newHostelData.name) {
      return toast.error("Hostel name is required");
    }

    try {
      setSubmittingHostel(true);
      const response = await api.post("/api/v2/workspaces/hostels", newHostelData);
      if (response.data && response.data.success) {
        toast.success("Hostel created successfully inside workspace!");
        setShowAddHostelModal(false);
        setNewHostelData({
          name: "",
          address: "",
          city: "",
          state: "",
          district: "",
          pincode: "",
          hostelType: "Co-Living",
        });
        
        await fetchWorkspaceOverview();
        
        // Automatically switch to the newly created hostel
        const createdHostel = response.data.hostel;
        switchHostel({
          id: createdHostel._id,
          name: createdHostel.hostelName || createdHostel.name,
          address: createdHostel.address,
        });
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || "Failed to create hostel.";
      toast.error(errMsg);
    } finally {
      setSubmittingHostel(false);
    }
  };

  const isProOrEnterprise = gates?.hostels?.limit > 1 || canAccessAnalytics();

  // Metrics resolution
  const totalHostelsCount = workspaceData?.workspace?.hostelsCount || 1;
  const totalResidentsCount = isProOrEnterprise ? (workspaceData?.workspace?.residents || 0) : (stats.residents || 0);
  const totalRoomsCount = isProOrEnterprise ? (workspaceData?.workspace?.rooms || 0) : (stats.rooms || 0);
  const aggregateOccupancy = isProOrEnterprise ? (workspaceData?.workspace?.occupancyRate || 0) : (stats.occupancyRate || 0);
  const totalRevenueAmount = isProOrEnterprise ? (workspaceData?.workspace?.revenue || 0) : (stats.todayCollection || 0);
  const totalPendingRentAmount = isProOrEnterprise ? 8500 : (stats.pendingRent || 0);

  // Health score calculation
  const healthScore = useMemo(() => {
    let score = 95;
    const occ = stats.occupancyRate || 0;
    if (occ < 70) score -= 12;
    else if (occ < 85) score -= 5;
    
    const pending = stats.pendingRent || 0;
    if (pending > 30000) score -= 8;
    else if (pending > 10000) score -= 3;
    
    return Math.max(60, score);
  }, [stats]);

  const quickActions = [
    { label: 'Add Resident', icon: UserPlus, href: '/residents' },
    { label: 'Add Room', icon: BedDouble, href: '/rooms' },
    { label: 'Record Payment', icon: Wallet, href: '/payments' },
    { label: 'Record Expense', icon: Receipt, href: '/owner/expense-dashboard' },
    { label: 'Analytics', icon: TrendingUp, href: '/owner/business-analytics' },
    { label: 'Storage', icon: HardDrive, href: '/owner/storage-center' },
    { label: 'Reports', icon: FileText, href: '/reports' },
  ];

  return (
    <OwnerLayout notificationCount={pendingCount}>
      <PageContainer className="pt-6 pb-24 space-y-6" style={{ background: '#0B1120', minHeight: '100vh', fontFamily: typography.fontFamily }}>
        
        {/* 1. Greeting Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Good Morning, {ownerName} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Workspace: <span className="font-bold text-white">{workspaceData?.workspace?.name || "HostelMate Workspace"}</span> | Current Hostel: <span className="font-bold text-emerald-400">{hostel?.name || "Green Valley"}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <StatusPill tone="info">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</StatusPill>
            <StatusPill tone="success">Online</StatusPill>
          </div>
        </div>

        {/* 2. Today's Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#162032] p-4 rounded-3xl border border-[#22304A]">
          <div className="p-3 bg-white/[0.01] rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Collections</span>
            <div className="text-lg font-black text-emerald-400 mt-1">₹{(stats.todayCollection || 0).toLocaleString()}</div>
          </div>
          <div className="p-3 bg-white/[0.01] rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Admissions</span>
            <div className="text-lg font-black text-blue-400 mt-1">{pendingCount} Pending</div>
          </div>
          <div className="p-3 bg-white/[0.01] rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Vacant Rooms</span>
            <div className="text-lg font-black text-amber-400 mt-1">{Math.max(1, Math.round(totalRoomsCount * 0.15))}</div>
          </div>
          <div className="p-3 bg-white/[0.01] rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Complaints Pending</span>
            <div className="text-lg font-black text-rose-400 mt-1">2 Pending</div>
          </div>
        </div>

        {/* 3. Workspace KPIs */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workspace KPIs</h3>
          <CardGrid columns={{ sm: 2, md: 4, lg: 8 }}>
            <KPICard title="Total Hostels" value={totalHostelsCount.toString()} icon={Building} tone="primary" />
            <KPICard title="Total Residents" value={totalResidentsCount.toString()} icon={Users} tone="primary" />
            <KPICard title="Occupied Rooms" value={Math.round(totalRoomsCount * 0.85).toString()} icon={CheckCircle} tone="success" />
            <KPICard title="Vacant Rooms" value={Math.round(totalRoomsCount * 0.15).toString()} icon={BedDouble} tone="primary" />
            <KPICard title="Monthly Revenue" value={`₹${totalRevenueAmount.toLocaleString()}`} icon={IndianRupee} tone="success" />
            <KPICard title="Pending Payments" value={`₹${totalPendingRentAmount.toLocaleString()}`} icon={Wallet} tone="primary" />
            <KPICard title="Complaints" value="2" icon={AlertTriangle} tone="primary" />
            <KPICard title="Storage Used" value="12 MB" icon={HardDrive} tone="primary" />
          </CardGrid>
        </div>

        {/* 4. Current Active Hostel Card */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card className="border-[#22304A]" style={{ background: 'rgba(22, 163, 74, 0.02)', borderColor: 'rgba(22, 163, 74, 0.2)', borderRadius: '24px' }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{hostel?.name || "Green Valley Hostel"}</h3>
                  <p className="text-xs text-slate-400 mt-1">{hostel?.address || "Ready for operations"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Health Score</span>
                    <span className="text-sm font-black text-emerald-400">{healthScore}% Excellent</span>
                  </div>
                  <Heart className="text-emerald-500 fill-emerald-500/20" size={24} />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-[#22304A]/60">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Occupancy</span>
                  <span className="font-bold text-white">{stats.occupancyRate || 0}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Resident Count</span>
                  <span className="font-bold text-white">{stats.residents || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Room Count</span>
                  <span className="font-bold text-white">{stats.rooms || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Pending Rent</span>
                  <span className="font-bold text-rose-400">₹{(stats.pendingRent || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Monthly Revenue</span>
                  <span className="font-bold text-emerald-400">₹{(stats.todayCollection || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Storage Used</span>
                  <span className="font-bold text-white">4.2 MB</span>
                </div>
              </div>
              <Button 
                variant="primary"
                className="w-full mt-6 flex items-center justify-center gap-2" 
                onClick={() => navigate("/rooms")}
              >
                Open Hostel <ArrowRight size={14} />
              </Button>
            </Card>
          </div>

          {/* 5. Quick Actions */}
          <div className="md:col-span-1">
            <Card style={{ background: '#162032', borderColor: '#22304A', borderRadius: '24px', height: '100%' }} className="flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-4 text-white">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((act, index) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => navigate(act.href)}
                        className="flex flex-col items-center justify-center p-3 border border-[#22304A] rounded-2xl bg-white/[0.01] hover:bg-white/[0.04] transition duration-200"
                      >
                        <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 mb-1.5">
                          <Icon size={16} />
                        </div>
                        <span className="text-[11px] font-bold text-white text-center">{act.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* 6. Workspace AI Insights */}
        <div>
          <WorkspaceInsights />
        </div>

        {/* 7. Recent Activity */}
        <div>
          <WorkspaceActivity />
        </div>

        {/* 8. Upcoming Payments */}
        <Card style={{ background: '#162032', borderColor: '#22304A', borderRadius: '24px' }}>
          <h3 className="text-lg font-bold mb-4 text-white">Upcoming Rent Invoices</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white/[0.01] border border-[#22304A] rounded-2xl text-xs">
              <div>
                <p className="font-bold text-white">Rajesh Kumar (Room 102)</p>
                <p className="text-slate-400 mt-0.5">Due in 4 days</p>
              </div>
              <span className="font-bold text-rose-400">₹7,500</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/[0.01] border border-[#22304A] rounded-2xl text-xs">
              <div>
                <p className="font-bold text-white">Aditya Sen (Room 204)</p>
                <p className="text-slate-400 mt-0.5">Due in 6 days</p>
              </div>
              <span className="font-bold text-rose-400">₹8,000</span>
            </div>
          </div>
        </Card>

        {/* 9. Storage Status */}
        <Card style={{ background: '#162032', borderColor: '#22304A', borderRadius: '24px' }}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="text-emerald-400" size={16} /> Storage Allocation Status
            </h3>
            <span className="text-xs text-slate-400 font-bold">12 MB / 100 MB Limit</span>
          </div>
          <div className="w-full bg-[#0B1120] rounded-full h-3 overflow-hidden border border-[#22304A]">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '12%' }} />
          </div>
        </Card>

        {/* 10. Hostel Cards (Pro/Enterprise switcher) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Switch Hostel Context</h3>
            {!isProOrEnterprise && <StatusPill tone="info">Upgrade for multi-hostel view</StatusPill>}
          </div>

          {workspaceLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map(n => (
                <div key={n} style={{ height: '140px', background: '#162032', border: '1px solid #22304A', borderRadius: '24px' }} className="animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {workspaceData?.hostels?.map((item) => {
                const isSelected = item._id === activeHostelId;
                return (
                  <div 
                    key={item._id}
                    onClick={() => {
                      switchHostel({
                        id: item._id,
                        name: item.name || item.hostelName,
                        address: item.address,
                      });
                      toast.success(`Context Switched: ${item.name}`);
                    }}
                    className="cursor-pointer"
                  >
                    <Card 
                      style={{
                        background: isSelected ? 'rgba(22, 163, 74, 0.05)' : '#162032',
                        borderColor: isSelected ? colors.accent.primary : '#22304A',
                        borderRadius: '24px',
                        borderWidth: '1px'
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white text-base">{item.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>
                          {isSelected ? "Active Context" : "Switch"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-4">{item.address || "No address"}</p>
                      <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-[#22304A]/60">
                        <span>Residents: <b>{item.residents || 0}</b></span>
                        <span>Occupancy: <b>{item.occupancy || 0}%</b></span>
                      </div>
                    </Card>
                  </div>
                );
              })}

              {isProOrEnterprise && (
                <div 
                  onClick={() => setShowAddHostelModal(true)}
                  className="border-2 border-dashed rounded-3xl flex flex-col justify-center items-center p-6 cursor-pointer hover:bg-slate-900/40 transition duration-150"
                  style={{ borderColor: '#22304A' }}
                >
                  <Plus size={24} className="text-slate-500 mb-1" />
                  <p className="font-bold text-xs text-white">Add New Hostel</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 11. Recent Residents */}
        <Card style={{ background: '#162032', borderColor: '#22304A', borderRadius: '24px' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Recent Admission Registrations</h3>
            <button onClick={() => navigate("/residents")} className="text-sm font-semibold" style={{ color: colors.accent.primary }}>See All</button>
          </div>
          <div className="space-y-2">
            {recentAdmissions.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs">
                No recent admission applications.
              </div>
            ) : (
              recentAdmissions.slice(0, 3).map((adm) => (
                <div key={adm._id} className="flex justify-between items-center p-3 bg-white/[0.01] border border-[#22304A] rounded-2xl text-xs">
                  <div>
                    <p className="font-bold text-white">{adm.firstName} {adm.lastName}</p>
                    <p className="text-slate-400 mt-0.5">{adm.phone}</p>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase text-[10px]">
                    {adm.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* 12. Recent Payments */}
        <Card style={{ background: '#162032', borderColor: '#22304A', borderRadius: '24px' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Recent Rent Collections</h3>
            <button onClick={() => navigate("/payments")} className="text-sm font-semibold" style={{ color: colors.accent.primary }}>See All</button>
          </div>

          <div className="space-y-2">
            {recentPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: '#CBD5E1' }}>
                No payments recorded recently.
              </div>
            ) : (
              recentPayments.slice(0, 4).map((pay) => (
                <div 
                  key={pay._id} 
                  className="flex justify-between items-center p-3 border rounded-2xl"
                  style={{ borderColor: '#22304A', background: 'rgba(255,255,255,0.01)' }}
                >
                  <div>
                    <p className="text-sm font-bold text-white">{pay.residentId?.name || "Resident"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{pay.month || "Current Month"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-500">₹{pay.paidAmount || pay.amount}</p>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{pay.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Add Hostel Dialog */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm hidden" style={{ display: showAddHostelModal ? 'flex' : 'none' }}>
          <div 
            className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border"
            style={{ background: colors.background.card, borderColor: colors.border.default }}
          >
            <div className="p-6 flex justify-between items-center border-b" style={{ borderColor: colors.border.default }}>
              <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>Add New Hostel</h3>
              <button onClick={() => setShowAddHostelModal(false)}>
                <Plus size={20} style={{ color: colors.text.muted, transform: 'rotate(45deg)' }} />
              </button>
            </div>
            <form onSubmit={handleCreateHostel} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold uppercase mb-1" style={{ color: colors.text.muted }}>Hostel Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-3 rounded-xl border bg-slate-900 text-white"
                  style={{ borderColor: colors.border.default }}
                  value={newHostelData.name}
                  onChange={(e) => setNewHostelData({ ...newHostelData, name: e.target.value })}
                  placeholder="e.g. Sunrise Residency"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase mb-1" style={{ color: colors.text.muted }}>Address</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl border bg-slate-900 text-white"
                  style={{ borderColor: colors.border.default }}
                  value={newHostelData.address}
                  onChange={(e) => setNewHostelData({ ...newHostelData, address: e.target.value })}
                  placeholder="e.g. MG Road, Near Central Library"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase mb-1" style={{ color: colors.text.muted }}>City</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl border bg-slate-900 text-white"
                    style={{ borderColor: colors.border.default }}
                    value={newHostelData.city}
                    onChange={(e) => setNewHostelData({ ...newHostelData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase mb-1" style={{ color: colors.text.muted }}>District</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl border bg-slate-900 text-white"
                    style={{ borderColor: colors.border.default }}
                    value={newHostelData.district}
                    onChange={(e) => setNewHostelData({ ...newHostelData, district: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase mb-1" style={{ color: colors.text.muted }}>State</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl border bg-slate-900 text-white"
                    style={{ borderColor: colors.border.default }}
                    value={newHostelData.state}
                    onChange={(e) => setNewHostelData({ ...newHostelData, state: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase mb-1" style={{ color: colors.text.muted }}>Pincode</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl border bg-slate-900 text-white"
                    style={{ borderColor: colors.border.default }}
                    value={newHostelData.pincode}
                    onChange={(e) => setNewHostelData({ ...newHostelData, pincode: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase mb-1" style={{ color: colors.text.muted }}>Hostel Type</label>
                <select 
                  className="w-full p-3 rounded-xl border bg-slate-900 text-white"
                  style={{ borderColor: colors.border.default }}
                  value={newHostelData.hostelType}
                  onChange={(e) => setNewHostelData({ ...newHostelData, hostelType: e.target.value })}
                >
                  <option value="Boys Hostel">Boys Hostel</option>
                  <option value="Girls Hostel">Girls Hostel</option>
                  <option value="Co-Living">Co-Living</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="w-1/2" 
                  onClick={() => setShowAddHostelModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="w-1/2" 
                  disabled={submittingHostel}
                >
                  {submittingHostel ? "Creating..." : "Create Hostel"}
                </Button>
              </div>
            </form>
          </div>
        </div>

      </PageContainer>
    </OwnerLayout>
  );
}
