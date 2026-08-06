import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Wallet,
  BedDouble,
  Clock,
  UserPlus,
  ArrowRightLeft,
  AlertCircle,
  Bell,
  ShieldCheck,
} from "lucide-react";
import { api } from "../services/api";
import toast from "react-hot-toast";
import StaffAttendanceWidget from "../components/StaffAttendanceWidget";

export default function WardenDashboard() {
  const [stats, setStats] = useState({
    residents: 0,
    pendingDues: 0,
    vacantBeds: 0,
    todayCollection: 0,
  });

  const fetchWardenStats = useCallback(async () => {
    try {
      const response = await api.get("/api/staff/dashboard");
      if (response.data.success) {
        setStats(response.data.stats || {});
      }
    } catch {
      toast.error("Unable to load warden dashboard statistics");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWardenStats();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchWardenStats]);

  return (
    <PageContainer
      title="Warden Operations Portal"
      subtitle="Resident Occupancy, Room Allocation, Complaints & Daily Dues Management"
    >
      {/* Self Service Attendance & Shift Widget */}
      <div className="mb-6">
        <StaffAttendanceWidget />
      </div>
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Residents</span>
            <Users size={18} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-400">{stats.residents || 0}</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Vacant Beds</span>
            <BedDouble size={18} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-blue-400">{stats.vacantBeds || 0}</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Pending Dues</span>
            <Wallet size={18} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-amber-400">
            ₹{(stats.pendingDues || 0).toLocaleString("en-IN")}
          </p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Today's Collections</span>
            <Clock size={18} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-400">
            ₹{(stats.todayCollection || 0).toLocaleString("en-IN")}
          </p>
        </Card>
      </div>

      {/* Quick Action Grid */}
      <h2 className="text-lg font-bold text-slate-200 mb-4">Warden Operational Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card hover className="p-5 cursor-pointer" onClick={() => window.location.href = "/residents"}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <UserPlus size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Resident Admissions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Register, update & view resident details</p>
            </div>
          </div>
        </Card>

        <Card hover className="p-5 cursor-pointer" onClick={() => window.location.href = "/rooms"}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
              <ArrowRightLeft size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Room & Bed Allocation</h3>
              <p className="text-xs text-slate-400 mt-0.5">Allocate beds, bed transfers & vacant beds</p>
            </div>
          </div>
        </Card>

        <Card hover className="p-5 cursor-pointer" onClick={() => window.location.href = "/payments"}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
              <Wallet size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Record Rent Payment</h3>
              <p className="text-xs text-slate-400 mt-0.5">Record incoming rent payments & due list</p>
            </div>
          </div>
        </Card>

        <Card hover className="p-5 cursor-pointer" onClick={() => toast.info("Opening Complaints Register")}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
              <AlertCircle size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Complaints Desk</h3>
              <p className="text-xs text-slate-400 mt-0.5">Register & resolve resident complaints</p>
            </div>
          </div>
        </Card>

        <Card hover className="p-5 cursor-pointer" onClick={() => window.location.href = "/notifications"}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
              <Bell size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Hostel Announcements</h3>
              <p className="text-xs text-slate-400 mt-0.5">View notifications & announcements</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3 p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-slate-400 text-xs">
        <ShieldCheck size={18} className="text-blue-400 shrink-0" />
        <span>Warden Access: Full access to residents, room allocation, dues and complaints. Restricted from Procurement, Treasury, AP, and Payroll.</span>
      </div>
    </PageContainer>
  );
}
