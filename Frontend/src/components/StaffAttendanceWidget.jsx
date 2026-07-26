import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle2,
  LogOut,
  Calendar,
  AlertCircle,
  PlusCircle,
  FileText,
  ShieldAlert,
  MapPin,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import { api } from "../services/api";
import toast from "react-hot-toast";

export default function StaffAttendanceWidget() {
  const [shift, setShift] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [history, setHistory] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  // Form states
  const [leaveForm, setLeaveForm] = useState({ leaveTypeId: "", fromDate: "", toDate: "", reason: "" });
  const [correctionForm, setCorrectionForm] = useState({ requestedCheckIn: "", requestedCheckOut: "", reason: "" });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [shiftRes, attRes, balRes] = await Promise.all([
        api.get("/api/shifts/me"),
        api.get("/api/attendance/me"),
        api.get("/api/leaves/balance"),
      ]);

      if (shiftRes.data.success) setShift(shiftRes.data.shift);
      if (attRes.data.success) {
        setAttendance(attRes.data.today);
        setHistory(attRes.data.history || []);
      }
      if (balRes.data.success) setLeaveBalances(balRes.data.balances || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const response = await api.post("/api/attendance/check-in", {
        attendanceSource: "Web",
        deviceInfo: navigator.userAgent.slice(0, 50),
      });
      if (response.data.success) {
        toast.success("Check-in successful!");
        fetchInitialData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Check-in failed");
    }
  };

  const handleCheckOut = async () => {
    try {
      const response = await api.post("/api/attendance/check-out", {});
      if (response.data.success) {
        toast.success("Check-out successful!");
        fetchInitialData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Check-out failed");
    }
  };

  const handleLeaveSubmit = async () => {
    if (!leaveForm.leaveTypeId || !leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason) {
      toast.error("Please fill out all leave request fields");
      return;
    }
    try {
      const response = await api.post("/api/leaves", leaveForm);
      if (response.data.success) {
        toast.success("Leave request submitted for owner approval");
        setIsLeaveModalOpen(false);
        setLeaveForm({ leaveTypeId: "", fromDate: "", toDate: "", reason: "" });
        fetchInitialData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit leave request");
    }
  };

  const handleCorrectionSubmit = async () => {
    if (!attendance?._id) {
      toast.error("No attendance record selected for correction");
      return;
    }
    if (!correctionForm.requestedCheckIn || !correctionForm.requestedCheckOut || !correctionForm.reason) {
      toast.error("Please fill out all correction fields");
      return;
    }
    try {
      const response = await api.post("/api/attendance/corrections", {
        attendanceId: attendance._id,
        ...correctionForm,
      });
      if (response.data.success) {
        toast.success("Attendance correction request submitted");
        setIsCorrectionModalOpen(false);
        setCorrectionForm({ requestedCheckIn: "", requestedCheckOut: "", reason: "" });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit correction request");
    }
  };

  return (
    <div className="space-y-6">
      {/* Shift & Check-In/Out Banner Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl text-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {shift ? `${shift.shiftName} Shift` : "General Shift"}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {shift ? `${shift.startTime} - ${shift.endTime}` : "09:00 - 17:00"}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">Daily Attendance & Clock</h2>
            <p className="text-xs text-slate-400 mt-1">
              {attendance?.checkIn
                ? `Checked in at ${new Date(attendance.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Not checked in yet today"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!attendance?.checkIn ? (
              <button
                onClick={handleCheckIn}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
              >
                <Clock size={18} /> Clock In Now
              </button>
            ) : !attendance?.checkOut ? (
              <button
                onClick={handleCheckOut}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-sm shadow-lg shadow-rose-500/20 transition transform active:scale-95"
              >
                <LogOut size={18} /> Clock Out Now
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-bold">
                <CheckCircle2 size={16} /> Completed Today ({attendance.workingHours} hrs)
              </div>
            )}

            <button
              onClick={() => setIsCorrectionModalOpen(true)}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
              title="Request Attendance Correction"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-200">My Leave Quotas</h3>
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20 transition"
          >
            <PlusCircle size={14} /> Request Leave
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {leaveBalances.map((bal, idx) => (
            <div key={idx} className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <p className="text-[11px] text-slate-400 truncate">{bal.leaveType.name}</p>
              <p className="text-lg font-bold text-white mt-1">
                {bal.remaining} <span className="text-[10px] text-slate-500 font-normal">/ {bal.allocated}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance History */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 mb-3">Recent Attendance Logs</h3>
        {history.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No recent attendance records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2 px-2">Date</th>
                  <th className="pb-2 px-2">Shift</th>
                  <th className="pb-2 px-2">In Time</th>
                  <th className="pb-2 px-2">Out Time</th>
                  <th className="pb-2 px-2">Hrs</th>
                  <th className="pb-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {history.slice(0, 7).map((item) => (
                  <tr key={item._id} className="text-slate-300">
                    <td className="py-2.5 px-2 font-medium">{new Date(item.attendanceDate).toLocaleDateString()}</td>
                    <td className="py-2.5 px-2 text-slate-400">{item.shiftId?.shiftName || "General"}</td>
                    <td className="py-2.5 px-2">
                      {item.checkIn ? new Date(item.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="py-2.5 px-2">
                      {item.checkOut ? new Date(item.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="py-2.5 px-2 font-bold text-emerald-400">{item.workingHours || 0}</td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.attendanceStatus === "Present"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : item.attendanceStatus === "Late"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {item.attendanceStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leave Application Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold mb-1">Apply for Leave</h3>
            <p className="text-xs text-slate-400 mb-4">Submit a formal leave request for Owner approval</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 mb-1 block">Leave Type</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  value={leaveForm.leaveTypeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })}
                >
                  <option value="">Select Leave Type</option>
                  {leaveBalances.map((b) => (
                    <option key={b.leaveType._id} value={b.leaveType._id}>
                      {b.leaveType.name} (Remaining: {b.remaining} days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 mb-1 block">From Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    value={leaveForm.fromDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 mb-1 block">To Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    value={leaveForm.toDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 mb-1 block">Reason</label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  placeholder="Explain reason for leave request..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsLeaveModalOpen(false)} className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl">
                Cancel
              </button>
              <button onClick={handleLeaveSubmit} className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl">
                Submit Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Correction Modal */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold mb-1">Attendance Correction</h3>
            <p className="text-xs text-slate-400 mb-4">Request check-in/out adjustment for Owner review</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 mb-1 block">Correct Check-In Time</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  value={correctionForm.requestedCheckIn}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, requestedCheckIn: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 mb-1 block">Correct Check-Out Time</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  value={correctionForm.requestedCheckOut}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, requestedCheckOut: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 mb-1 block">Reason for Correction</label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  placeholder="e.g. Forgot to clock out, device network error..."
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsCorrectionModalOpen(false)} className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl">
                Cancel
              </button>
              <button onClick={handleCorrectionSubmit} className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl">
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
