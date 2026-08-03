import { useTheme } from "../design-system/ThemeProvider";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";
import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Plus,
  Calendar,
  Check,
  X,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
  Clock3,
} from "lucide-react";
import { api } from "../services/api";
import toast from "react-hot-toast";


export default function AttendanceShiftManagement() {
  
  const [activeTab, setActiveTab] = useState("attendance"); // attendance, shifts, corrections, approvals
  const [summary, setSummary] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Shift modals
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    shiftCode: "",
    shiftName: "Morning",
    startTime: "08:00",
    endTime: "16:00",
    breakDuration: 30,
    workingHours: 8,
  });
  const [assignForm, setAssignForm] = useState({ staffId: "", shiftId: "", effectiveFrom: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, shiftRes, staffRes, corrRes, leaveRes, otRes] = await Promise.all([
        api.get("/api/attendance/summary"),
        api.get("/api/shifts"),
        api.get("/api/staff"),
        api.get("/api/attendance/corrections"),
        api.get("/api/leaves"),
        api.get("/api/overtime"),
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.summary);
      if (shiftRes.data.success) setShifts(shiftRes.data.shifts || []);
      if (staffRes.data.success) setStaffList(staffRes.data.staff || []);
      if (corrRes.data.success) setCorrections(corrRes.data.corrections || []);
      if (leaveRes.data.success) setLeaves(leaveRes.data.leaves || []);
      if (otRes.data.success) setOvertimes(otRes.data.overtimeRequests || []);
    } catch (error) {
      toast.error("Unable to load attendance & shift management data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = async () => {
    try {
      const response = await api.post("/api/shifts", shiftForm);
      if (response.data.success) {
        toast.success("Shift created successfully");
        setIsShiftModalOpen(false);
        fetchData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create shift");
    }
  };

  const handleAssignShift = async () => {
    try {
      const response = await api.post("/api/shifts/assign", assignForm);
      if (response.data.success) {
        toast.success("Shift assigned to staff");
        setIsAssignModalOpen(false);
        fetchData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to assign shift");
    }
  };

  const handleApproveCorrection = async (id) => {
    try {
      const response = await api.patch(`/api/attendance/corrections/${id}/approve`);
      if (response.data.success) {
        toast.success("Correction approved");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to approve correction");
    }
  };

  const handleRejectCorrection = async (id) => {
    try {
      const response = await api.patch(`/api/attendance/corrections/${id}/reject`);
      if (response.data.success) {
        toast.success("Correction rejected");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to reject correction");
    }
  };

  const handleApproveLeave = async (id) => {
    try {
      const response = await api.patch(`/api/leaves/${id}/approve`);
      if (response.data.success) {
        toast.success("Leave approved");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to approve leave");
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      const response = await api.patch(`/api/leaves/${id}/reject`, { remarks: "Rejected by Owner" });
      if (response.data.success) {
        toast.success("Leave rejected");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to reject leave");
    }
  };

  const handleApproveOvertime = async (id) => {
    try {
      const response = await api.patch(`/api/overtime/${id}/approve`);
      if (response.data.success) {
        toast.success("Overtime claim approved");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to approve overtime");
    }
  };

  return (
    <PageContainer
      title="Attendance, Shifts & Leave Control"
      subtitle="Real-time Staff Check-Ins, Roster Assignments & Approval Center"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsShiftModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
          >
            <Plus size={14} /> Create Shift
          </button>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
          >
            <Users size={14} /> Assign Roster
          </button>
        </div>
      }
    >
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Attendance %</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-400">{summary?.attendancePercentage || 0}%</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>On Duty Now</span>
            <Clock size={16} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-blue-400">{summary?.onDuty || 0}</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Present Today</span>
            <Users size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-white">{summary?.present || 0}</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Late Arrivals</span>
            <AlertTriangle size={16} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-amber-400">{summary?.late || 0}</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>On Leave</span>
            <Calendar size={16} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-400">{summary?.onLeave || 0}</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Overtime Hrs</span>
            <Clock3 size={16} className="text-cyan-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-cyan-400">{summary?.totalOvertimeHours || 0} hrs</p>
        </Card>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "attendance" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:bg-slate-800"
          }`}
        >
          Today's Attendance ({summary?.records?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("shifts")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "shifts" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:bg-slate-800"
          }`}
        >
          Shift Roster ({shifts.length})
        </button>
        <button
          onClick={() => setActiveTab("corrections")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "corrections" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:bg-slate-800"
          }`}
        >
          Correction Requests ({corrections.filter((c) => c.status === "Pending").length})
        </button>
        <button
          onClick={() => setActiveTab("approvals")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "approvals" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:bg-slate-800"
          }`}
        >
          Leave & Overtime Approvals ({leaves.filter((l) => l.status === "Pending").length + overtimes.filter((o) => o.status === "Pending").length})
        </button>
      </div>

      {/* TAB 1: Attendance Log */}
      {activeTab === "attendance" && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Working Hours</th>
                  <th className="py-3 px-4">Late Mins</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {summary?.records?.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-white">
                      {record.staffId?.fullName} ({record.staffId?.employeeCode})
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400">
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-400">
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="py-3 px-4 font-bold">{record.workingHours || 0} hrs</td>
                    <td className="py-3 px-4 text-amber-400">{record.lateMinutes ? `${record.lateMinutes} mins` : "0"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 border border-slate-700 text-slate-300">
                        {record.attendanceSource || "Web"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill tone={record.attendanceStatus === "Present" ? "success" : record.attendanceStatus === "Late" ? "warning" : "danger"}>
                        {record.attendanceStatus}
                      </StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: Shift Roster */}
      {activeTab === "shifts" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {shifts.map((shift) => (
            <Card key={shift._id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {shift.shiftCode}
                </span>
                <span className="text-xs text-slate-400 font-mono">{shift.workingHours} hrs/day</span>
              </div>
              <h3 className="text-lg font-bold text-white">{shift.shiftName} Shift</h3>
              <p className="text-xs text-slate-400 mt-1">
                Timings: <span className="text-slate-200 font-mono">{shift.startTime} - {shift.endTime}</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Break: {shift.breakDuration} mins</p>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 3: Corrections Center */}
      {activeTab === "corrections" && (
        <Card className="p-4 space-y-3">
          {corrections.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">No attendance correction requests.</p>
          ) : (
            corrections.map((corr) => (
              <div key={corr._id} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-white text-sm">{corr.staffId?.fullName} ({corr.staffId?.employeeCode})</p>
                  <p className="text-xs text-slate-400 mt-1">Reason: "{corr.reason}"</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5 font-mono">
                    Requested In: {new Date(corr.requestedCheckIn).toLocaleString()} | Out: {new Date(corr.requestedCheckOut).toLocaleString()}
                  </p>
                </div>
                {corr.status === "Pending" ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveCorrection(corr._id)}
                      className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => handleRejectCorrection(corr._id)}
                      className="p-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <StatusPill tone={corr.status === "Approved" ? "success" : "danger"}>{corr.status}</StatusPill>
                )}
              </div>
            ))
          )}
        </Card>
      )}

      {/* TAB 4: Leave & Overtime Approvals */}
      {activeTab === "approvals" && (
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-300">Pending Leave Applications</h3>
          {leaves.filter((l) => l.status === "Pending").length === 0 ? (
            <p className="text-xs text-slate-500 py-2">No pending leave requests.</p>
          ) : (
            leaves
              .filter((l) => l.status === "Pending")
              .map((l) => (
                <div key={l._id} className="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-xs">{l.staffId?.fullName} ({l.leaveTypeId?.name})</p>
                    <p className="text-[11px] text-slate-400">{l.numberOfDays} Day(s) | Reason: {l.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveLeave(l._id)} className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg">
                      Approve
                    </button>
                    <button onClick={() => handleRejectLeave(l._id)} className="px-3 py-1 bg-rose-500 text-white text-xs rounded-lg">
                      Reject
                    </button>
                  </div>
                </div>
              ))
          )}

          <h3 className="text-sm font-bold text-slate-300 pt-4 border-t border-slate-800">Pending Overtime Claims</h3>
          {overtimes.filter((o) => o.status === "Pending").length === 0 ? (
            <p className="text-xs text-slate-500 py-2">No pending overtime claims.</p>
          ) : (
            overtimes
              .filter((o) => o.status === "Pending")
              .map((o) => (
                <div key={o._id} className="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-xs">{o.staffId?.fullName} - {o.hours} Overtime Hours</p>
                    <p className="text-[11px] text-slate-400">{o.reason}</p>
                  </div>
                  <button onClick={() => handleApproveOvertime(o._id)} className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg">
                    Approve Overtime
                  </button>
                </div>
              ))
          )}
        </Card>
      )}

      {/* Create Shift Modal */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold mb-4">Create New Shift</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 mb-1 block">Shift Code</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="SH-MOR"
                  value={shiftForm.shiftCode}
                  onChange={(e) => setShiftForm({ ...shiftForm, shiftCode: e.target.value })}
                />
              </div>
              <div>
                <label className="text-slate-300 mb-1 block">Shift Name</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  value={shiftForm.shiftName}
                  onChange={(e) => setShiftForm({ ...shiftForm, shiftName: e.target.value })}
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 mb-1 block">Start Time</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    placeholder="08:00"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-slate-300 mb-1 block">End Time</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    placeholder="16:00"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsShiftModalOpen(false)} className="px-4 py-2 bg-slate-800 text-xs rounded-xl">Cancel</button>
              <button onClick={handleCreateShift} className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl">Create Shift</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Shift Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold mb-4">Assign Staff Shift Roster</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 mb-1 block">Select Staff</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  value={assignForm.staffId}
                  onChange={(e) => setAssignForm({ ...assignForm, staffId: e.target.value })}
                >
                  <option value="">Select Staff Member</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.fullName} ({s.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-300 mb-1 block">Select Shift</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  value={assignForm.shiftId}
                  onChange={(e) => setAssignForm({ ...assignForm, shiftId: e.target.value })}
                >
                  <option value="">Select Shift</option>
                  {shifts.map((sh) => (
                    <option key={sh._id} value={sh._id}>
                      {sh.shiftName} ({sh.startTime} - {sh.endTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 bg-slate-800 text-xs rounded-xl">Cancel</button>
              <button onClick={handleAssignShift} className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl">Assign Shift</button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
