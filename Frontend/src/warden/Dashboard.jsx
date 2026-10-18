import { useState, useEffect, useCallback } from "react";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import {
  Users,
  Wallet,
  BedDouble,
  Clock,
  UserPlus,
  ArrowRightLeft,
  AlertCircle,
  ShieldCheck,
  Search,
  CheckCircle2,
  Plus,
  RefreshCw,
  LogOut,
  LogIn,
  Layers,
} from "lucide-react";
import { api } from "../services/api";
import toast from "react-hot-toast";
import StaffAttendanceWidget from "../components/StaffAttendanceWidget";
import ConfirmDialog from "../superadmin/components/modals/ConfirmDialog";

export default function WardenDashboard() {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "residents" | "rooms" | "complaints"

  // Stats
  const [stats, setStats] = useState({
    residents: 0,
    pendingDues: 0,
    vacantBeds: 0,
    todayCollection: 0,
  });

  // Residents State
  const [residents, setResidents] = useState([]);
  const [residentsLoading, setResidentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roomFilter, setRoomFilter] = useState("ALL");

  // Rooms & Beds State
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Complaints / Maintenance State
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintStatusFilter, setComplaintStatusFilter] = useState("ALL");

  // Modals
  const [showTransferModal, setShowTransferModal] = useState(null); // resident object
  const [transferData, setTransferData] = useState({ newRoomId: "", newBedId: "", reason: "" });
  const [transferring, setTransferring] = useState(false);

  const [showCheckoutModal, setShowCheckoutModal] = useState(null); // resident object
  const [checkoutData, setCheckoutData] = useState({ remarks: "", actualCheckoutDate: new Date().toISOString().split("T")[0] });
  const [checkingOut, setCheckingOut] = useState(false);

  const [showCheckinModal, setShowCheckinModal] = useState(null); // resident object
  const [checkinData, setCheckinData] = useState({ roomId: "", bedId: "" });
  const [checkingIn, setCheckingIn] = useState(false);

  const [showNewComplaintModal, setShowNewComplaintModal] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    targetType: "Room",
    targetId: "",
    targetName: "",
    reason: "",
    performedBy: "",
  });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const [completeComplaintId, setCompleteComplaintId] = useState(null);

  // 1. Fetch Dashboard Overview Statistics
  const fetchWardenStats = useCallback(async () => {
    try {
      const response = await api.get("/api/staff/dashboard?role=warden");
      if (response.data.success) {
        setStats(response.data.stats || {});
      }
    } catch {
      toast.error("Unable to load warden dashboard statistics");
    }
  }, []);

  // 2. Fetch Residents Directory
  const fetchResidents = useCallback(async () => {
    try {
      setResidentsLoading(true);
      const res = await api.get("/api/residents");
      if (res.data?.success) {
        setResidents(res.data.residents || []);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load residents");
    } finally {
      setResidentsLoading(false);
    }
  }, []);

  // 3. Fetch Rooms & Beds
  const fetchRooms = useCallback(async () => {
    try {
      setRoomsLoading(true);
      const res = await api.get("/api/rooms");
      if (res.data?.success) {
        setRooms(res.data.rooms || []);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load rooms catalog");
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  // 4. Fetch Complaints / Maintenance Logs
  const fetchComplaints = useCallback(async () => {
    try {
      setComplaintsLoading(true);
      const res = await api.get("/api/maintenance");
      if (res.data?.success) {
        setComplaints(res.data.logs || []);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load complaints log");
    } finally {
      setComplaintsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWardenStats();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchWardenStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "residents") {
        fetchResidents();
        fetchRooms();
      } else if (activeTab === "rooms") {
        fetchRooms();
      } else if (activeTab === "complaints") {
        fetchComplaints();
        fetchRooms();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, fetchResidents, fetchRooms, fetchComplaints]);

  // Handler: Transfer Bed/Room
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!showTransferModal || !transferData.newRoomId || !transferData.newBedId) {
      toast.error("Please select a target room and bed");
      return;
    }
    try {
      setTransferring(true);
      const res = await api.patch("/api/residents/transfer-bed", {
        residentId: showTransferModal._id || showTransferModal.id,
        newRoomId: transferData.newRoomId,
        newBedId: transferData.newBedId,
        reason: transferData.reason || "Warden transfer request",
      });
      if (res.data?.success) {
        toast.success("Bed transfer completed successfully!");
        setShowTransferModal(null);
        setTransferData({ newRoomId: "", newBedId: "", reason: "" });
        fetchResidents();
        fetchWardenStats();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Transfer failed");
    } finally {
      setTransferring(false);
    }
  };

  // Handler: Checkout Resident
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!showCheckoutModal) return;
    try {
      setCheckingOut(true);
      const res = await api.patch("/api/residents/checkout", {
        residentId: showCheckoutModal._id || showCheckoutModal.id,
        actualCheckoutDate: checkoutData.actualCheckoutDate,
        remarks: checkoutData.remarks,
      });
      if (res.data?.success) {
        toast.success("Resident checked out & bed released!");
        setShowCheckoutModal(null);
        setCheckoutData({ remarks: "", actualCheckoutDate: new Date().toISOString().split("T")[0] });
        fetchResidents();
        fetchWardenStats();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Check-out failed");
    } finally {
      setCheckingOut(false);
    }
  };

  // Handler: Check-in Resident
  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    if (!showCheckinModal || !checkinData.roomId || !checkinData.bedId) {
      toast.error("Please select a valid room and bed for check-in");
      return;
    }
    try {
      setCheckingIn(true);
      const res = await api.patch("/api/residents/checkin", {
        residentId: showCheckinModal._id || showCheckinModal.id,
        roomId: checkinData.roomId,
        bedId: checkinData.bedId,
      });
      if (res.data?.success) {
        toast.success("Resident checked in successfully!");
        setShowCheckinModal(null);
        setCheckinData({ roomId: "", bedId: "" });
        fetchResidents();
        fetchWardenStats();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Check-in failed");
    } finally {
      setCheckingIn(false);
    }
  };

  // Handler: Create Complaint/Maintenance Ticket
  const handleNewComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!newComplaint.targetId || !newComplaint.reason) {
      toast.error("Target location and description are required");
      return;
    }
    try {
      setSubmittingComplaint(true);
      const res = await api.post("/api/maintenance", newComplaint);
      if (res.data?.success) {
        toast.success("Complaint/Maintenance issue logged!");
        setShowNewComplaintModal(false);
        setNewComplaint({ targetType: "Room", targetId: "", targetName: "", reason: "", performedBy: "" });
        fetchComplaints();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to log complaint");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Handler: Resolve Complaint
  const confirmResolveComplaint = async () => {
    if (!completeComplaintId) return;
    try {
      const res = await api.patch(`/api/maintenance/${completeComplaintId}/complete`, {
        completedDate: new Date(),
      });
      if (res.data?.success) {
        toast.success("Complaint marked as resolved!");
        fetchComplaints();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to resolve complaint");
    } finally {
      setCompleteComplaintId(null);
    }
  };

  // Filtered residents list
  const filteredResidents = residents.filter((r) => {
    const fullName = `${r.firstName || ""} ${r.lastName || ""} ${r.fullName || ""}`.toLowerCase();
    const phone = (r.phone || "").toLowerCase();
    const roomNum = (r.roomNumber || r.roomId?.roomNumber || "").toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm.toLowerCase()) ||
      roomNum.includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || (r.status || "").toUpperCase() === statusFilter.toUpperCase();

    const matchesRoom =
      roomFilter === "ALL" ||
      r.roomId === roomFilter ||
      r.roomId?._id === roomFilter ||
      (r.roomNumber && String(r.roomNumber) === String(roomFilter));

    return matchesSearch && matchesStatus && matchesRoom;
  });

  // Filtered complaints list
  const filteredComplaints = complaints.filter((c) => {
    if (complaintStatusFilter === "ALL") return true;
    return (c.status || "").toLowerCase() === complaintStatusFilter.toLowerCase();
  });

  // Available vacant beds helper for transfer/checkin modals
  const selectedRoomForTransfer = rooms.find((rm) => (rm._id || rm.id) === transferData.newRoomId);
  const vacantBedsForTransfer = (selectedRoomForTransfer?.beds || []).filter(
    (b) => b.status === "Vacant" || b.status === "vacant"
  );

  const selectedRoomForCheckin = rooms.find((rm) => (rm._id || rm.id) === checkinData.roomId);
  const vacantBedsForCheckin = (selectedRoomForCheckin?.beds || []).filter(
    (b) => b.status === "Vacant" || b.status === "vacant"
  );

  return (
    <PageContainer
      title="Warden Operations Portal"
      subtitle="Resident Occupancy, Room Allocation, Check-in/out & Complaints Management"
    >
      {/* Self Service Attendance & Shift Widget */}
      <div className="mb-6">
        <StaffAttendanceWidget />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-700/60 mb-6 gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 cursor-pointer ${
            activeTab === "overview"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Layers size={16} /> Overview & Quick Actions
        </button>
        <button
          onClick={() => setActiveTab("residents")}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 cursor-pointer ${
            activeTab === "residents"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Users size={16} /> Resident Directory ({residents.length})
        </button>
        <button
          onClick={() => setActiveTab("rooms")}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 cursor-pointer ${
            activeTab === "rooms"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <BedDouble size={16} /> Room & Bed Matrix
        </button>
        <button
          onClick={() => setActiveTab("complaints")}
          className={`pb-3 px-4 flex items-center gap-2 transition border-b-2 cursor-pointer ${
            activeTab === "complaints"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <AlertCircle size={16} /> Complaints Desk ({complaints.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col justify-between bg-[#131C2E] border-[#202B45]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Active Residents</span>
                <Users size={18} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-bold mt-2 text-emerald-400">{stats.residents || 0}</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between bg-[#131C2E] border-[#202B45]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Vacant Beds</span>
                <BedDouble size={18} className="text-blue-400" />
              </div>
              <p className="text-2xl font-bold mt-2 text-blue-400">{stats.vacantBeds || 0}</p>
            </Card>

            <Card className="p-4 flex flex-col justify-between bg-[#131C2E] border-[#202B45]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Pending Rent Dues</span>
                <Wallet size={18} className="text-amber-400" />
              </div>
              <p className="text-2xl font-bold mt-2 text-amber-400">
                ₹{(stats.pendingDues || 0).toLocaleString("en-IN")}
              </p>
            </Card>

            <Card className="p-4 flex flex-col justify-between bg-[#131C2E] border-[#202B45]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Today's Collections</span>
                <Clock size={18} className="text-purple-400" />
              </div>
              <p className="text-2xl font-bold mt-2 text-purple-400">
                ₹{(stats.todayCollection || 0).toLocaleString("en-IN")}
              </p>
            </Card>
          </div>

          {/* Operational Tool Shortcut Grid */}
          <h2 className="text-base font-bold text-slate-200">Warden Core Operational Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card hover className="p-5 cursor-pointer bg-[#131C2E] border-[#202B45]" onClick={() => setActiveTab("residents")}>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Resident Directory & Search</h3>
                  <p className="text-xs text-slate-400 mt-0.5">View residents, check-in, check-out & bed transfers</p>
                </div>
              </div>
            </Card>

            <Card hover className="p-5 cursor-pointer bg-[#131C2E] border-[#202B45]" onClick={() => setActiveTab("rooms")}>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                  <ArrowRightLeft size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Room & Bed Allocations</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Inspect vacant beds, occupancy & room layout</p>
                </div>
              </div>
            </Card>

            <Card hover className="p-5 cursor-pointer bg-[#131C2E] border-[#202B45]" onClick={() => setActiveTab("complaints")}>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Complaints Desk</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Log new issues & resolve maintenance logs</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-slate-400 text-xs">
            <ShieldCheck size={18} className="text-blue-400 shrink-0" />
            <span>Warden Access: Full access to residents, room allocation, dues and complaints. Restricted from Procurement, Treasury, AP, and Payroll.</span>
          </div>
        </div>
      )}

      {/* TAB 2: RESIDENTS DIRECTORY */}
      {activeTab === "residents" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-[#131C2E] p-4 rounded-2xl border border-[#202B45]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search resident name, phone, or room number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="bg-[#0B1220] border border-[#202B45] text-white text-xs rounded-xl px-3 py-2"
              >
                <option value="ALL">All Rooms</option>
                {rooms.map((rm) => (
                  <option key={rm._id || rm.id} value={rm._id || rm.id}>
                    Room {rm.roomNumber}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0B1220] border border-[#202B45] text-white text-xs rounded-xl px-3 py-2"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING ADMISSION">Pending Admission</option>
                <option value="NOTICE PERIOD">Notice Period</option>
                <option value="CHECKED OUT">Checked Out</option>
              </select>

              <button
                onClick={fetchResidents}
                className="p-2 bg-[#0B1220] border border-[#202B45] rounded-xl text-slate-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                title="Refresh Residents"
              >
                <RefreshCw size={14} className={residentsLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Residents Table */}
          {residentsLoading ? (
            <div className="p-8 text-center text-slate-400 bg-[#131C2E] rounded-2xl border border-[#202B45] animate-pulse">
              Loading resident directory...
            </div>
          ) : filteredResidents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-[#131C2E] rounded-2xl border border-[#202B45]">
              No residents found matching your search or filters.
            </div>
          ) : (
            <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0B1220] border-b border-[#202B45] text-slate-400 uppercase text-[11px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Resident</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Room / Bed</th>
                      <th className="px-4 py-3">Rent / Status</th>
                      <th className="px-4 py-3 text-right">Warden Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202B45]">
                    {filteredResidents.map((r) => {
                      const isPending = (r.status || "").toLowerCase().includes("pending");
                      const isActive = (r.status || "").toLowerCase() === "active";

                      return (
                        <tr key={r._id || r.id} className="hover:bg-white/5 transition">
                          <td className="px-4 py-3 font-bold text-white">
                            {r.firstName || r.fullName || "Resident"} {r.lastName || ""}
                            <div className="text-[10px] font-normal text-slate-400">{r.occupation || "Resident"}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-mono text-slate-300">{r.phone || "—"}</div>
                            <div className="text-[10px] text-slate-500">{r.email || "No email"}</div>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            <span className="font-bold text-emerald-400">Room {r.roomNumber || r.roomId?.roomNumber || "Unassigned"}</span>
                            <span className="text-slate-400 text-[10px] block">Bed {r.bedNumber || r.bedId?.bedNumber || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-white">₹{Number(r.monthlyRent || 0).toLocaleString("en-IN")}/mo</div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-0.5 ${
                                isActive
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : isPending
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                              }`}
                            >
                              {r.status || "Active"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1">
                            {isPending && (
                              <button
                                onClick={() => setShowCheckinModal(r)}
                                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <LogIn size={12} /> Check-In
                              </button>
                            )}
                            {isActive && (
                              <>
                                <button
                                  onClick={() => setShowTransferModal(r)}
                                  className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <ArrowRightLeft size={12} /> Transfer Bed
                                </button>
                                <button
                                  onClick={() => setShowCheckoutModal(r)}
                                  className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <LogOut size={12} /> Check-Out
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ROOM & BED MATRIX */}
      {activeTab === "rooms" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-[#131C2E] p-4 rounded-2xl border border-[#202B45]">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hostel Room & Bed Occupancy Grid</h3>
            <button onClick={fetchRooms} className="p-2 bg-[#0B1220] border border-[#202B45] rounded-xl text-slate-300 hover:text-white text-xs cursor-pointer">
              <RefreshCw size={14} className={roomsLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {roomsLoading ? (
            <div className="p-8 text-center text-slate-400 bg-[#131C2E] rounded-2xl border border-[#202B45] animate-pulse">
              Loading rooms catalog...
            </div>
          ) : rooms.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-[#131C2E] rounded-2xl border border-[#202B45]">
              No rooms registered in this hostel workspace.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((rm) => (
                <Card key={rm._id || rm.id} className="p-4 bg-[#131C2E] border-[#202B45] space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-[#202B45]">
                    <div>
                      <h4 className="font-bold text-white text-base">Room {rm.roomNumber}</h4>
                      <p className="text-[10px] text-slate-400">{rm.roomType || "Standard"} • Floor {rm.floor || 1}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      ₹{Number(rm.rentAmount || 0).toLocaleString("en-IN")}/mo
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Beds ({rm.beds?.length || rm.totalBeds || 0})</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(rm.beds || []).map((b) => {
                        const isVacant = b.status === "Vacant" || b.status === "vacant";
                        const isOccupied = b.status === "Occupied" || b.status === "occupied";
                        return (
                          <div
                            key={b._id || b.bedNumber}
                            className={`p-2 rounded-xl text-xs flex justify-between items-center border ${
                              isVacant
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                : isOccupied
                                ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                                : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            }`}
                          >
                            <span className="font-bold">Bed {b.bedNumber}</span>
                            <span className="text-[10px] uppercase font-mono">{b.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COMPLAINTS & MAINTENANCE DESK */}
      {activeTab === "complaints" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-[#131C2E] p-4 rounded-2xl border border-[#202B45]">
            <div className="flex items-center gap-2">
              <select
                value={complaintStatusFilter}
                onChange={(e) => setComplaintStatusFilter(e.target.value)}
                className="bg-[#0B1220] border border-[#202B45] text-white text-xs rounded-xl px-3 py-2"
              >
                <option value="ALL">All Statuses</option>
                <option value="In Progress">In Progress</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
              </select>
              <button onClick={fetchComplaints} className="p-2 bg-[#0B1220] border border-[#202B45] rounded-xl text-slate-300 hover:text-white text-xs cursor-pointer">
                <RefreshCw size={14} className={complaintsLoading ? "animate-spin" : ""} />
              </button>
            </div>

            <button
              onClick={() => setShowNewComplaintModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Log New Complaint / Ticket
            </button>
          </div>

          {complaintsLoading ? (
            <div className="p-8 text-center text-slate-400 bg-[#131C2E] rounded-2xl border border-[#202B45] animate-pulse">
              Loading complaints log...
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-[#131C2E] rounded-2xl border border-[#202B45]">
              No active complaints or maintenance logs recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredComplaints.map((c) => {
                const isCompleted = (c.status || "").toLowerCase() === "completed";
                return (
                  <Card key={c._id} className="p-4 bg-[#131C2E] border-[#202B45] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{c.targetType}: {c.targetName || c.targetId}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isCompleted ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{c.reason}</p>
                      <div className="text-[10px] text-slate-500 flex gap-3">
                        <span>Logged: {new Date(c.createdAt || c.startDate).toLocaleDateString()}</span>
                        {c.performedBy && <span>Staff: {c.performedBy}</span>}
                      </div>
                    </div>

                    {!isCompleted && (
                      <button
                        onClick={() => setCompleteComplaintId(c._id)}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
                      >
                        <CheckCircle2 size={14} /> Resolve Ticket
                      </button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: TRANSFER BED */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1739] border border-[#22304A] rounded-2xl max-w-md w-full p-6 space-y-4 text-xs text-white">
            <h3 className="text-base font-bold border-b border-[#22304A] pb-3">
              Transfer Resident: {showTransferModal.firstName || showTransferModal.fullName}
            </h3>
            <form onSubmit={handleTransferSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Target Room *</label>
                <select
                  required
                  value={transferData.newRoomId}
                  onChange={(e) => setTransferData({ ...transferData, newRoomId: e.target.value, newBedId: "" })}
                  className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                >
                  <option value="">Select Target Room</option>
                  {rooms.map((rm) => (
                    <option key={rm._id || rm.id} value={rm._id || rm.id}>
                      Room {rm.roomNumber} ({rm.roomType || "Std"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Target Vacant Bed *</label>
                <select
                  required
                  disabled={!transferData.newRoomId}
                  value={transferData.newBedId}
                  onChange={(e) => setTransferData({ ...transferData, newBedId: e.target.value })}
                  className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white disabled:opacity-50"
                >
                  <option value="">Select Vacant Bed</option>
                  {vacantBedsForTransfer.map((bd) => (
                    <option key={bd._id || bd.bedNumber} value={bd._id || bd.id}>
                      Bed {bd.bedNumber}
                    </option>
                  ))}
                </select>
                {transferData.newRoomId && vacantBedsForTransfer.length === 0 && (
                  <p className="text-[10px] text-amber-400 mt-1">No vacant beds available in this room.</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Reason for Transfer</label>
                <input
                  type="text"
                  placeholder="e.g. Resident request / Room maintenance"
                  value={transferData.reason}
                  onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                  className="w-full bg-white/5 border border-[#22304A] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTransferModal(null)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" disabled={transferring} className="w-1/2 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 cursor-pointer">
                  {transferring ? "Transferring..." : "Confirm Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHECKOUT RESIDENT */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1739] border border-[#22304A] rounded-2xl max-w-md w-full p-6 space-y-4 text-xs text-white">
            <h3 className="text-base font-bold border-b border-[#22304A] pb-3 text-rose-400">
              Process Checkout: {showCheckoutModal.firstName || showCheckoutModal.fullName}
            </h3>
            <form onSubmit={handleCheckoutSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Actual Checkout Date *</label>
                <input
                  type="date"
                  required
                  value={checkoutData.actualCheckoutDate}
                  onChange={(e) => setCheckoutData({ ...checkoutData, actualCheckoutDate: e.target.value })}
                  className="w-full bg-white/5 border border-[#22304A] rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Remarks / Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cleared dues, returned keys."
                  value={checkoutData.remarks}
                  onChange={(e) => setCheckoutData({ ...checkoutData, remarks: e.target.value })}
                  className="w-full bg-white/5 border border-[#22304A] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCheckoutModal(null)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" disabled={checkingOut} className="w-1/2 py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 cursor-pointer">
                  {checkingOut ? "Processing..." : "Confirm Checkout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CHECKIN RESIDENT */}
      {showCheckinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1739] border border-[#22304A] rounded-2xl max-w-md w-full p-6 space-y-4 text-xs text-white">
            <h3 className="text-base font-bold border-b border-[#22304A] pb-3 text-emerald-400">
              Process Check-In: {showCheckinModal.firstName || showCheckinModal.fullName}
            </h3>
            <form onSubmit={handleCheckinSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Room *</label>
                <select
                  required
                  value={checkinData.roomId}
                  onChange={(e) => setCheckinData({ ...checkinData, roomId: e.target.value, bedId: "" })}
                  className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                >
                  <option value="">Select Room</option>
                  {rooms.map((rm) => (
                    <option key={rm._id || rm.id} value={rm._id || rm.id}>
                      Room {rm.roomNumber} ({rm.roomType || "Std"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Vacant Bed *</label>
                <select
                  required
                  disabled={!checkinData.roomId}
                  value={checkinData.bedId}
                  onChange={(e) => setCheckinData({ ...checkinData, bedId: e.target.value })}
                  className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white disabled:opacity-50"
                >
                  <option value="">Select Bed</option>
                  {vacantBedsForCheckin.map((bd) => (
                    <option key={bd._id || bd.bedNumber} value={bd._id || bd.id}>
                      Bed {bd.bedNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCheckinModal(null)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" disabled={checkingIn} className="w-1/2 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 cursor-pointer">
                  {checkingIn ? "Checking In..." : "Confirm Check-In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: NEW COMPLAINT LOG */}
      {showNewComplaintModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1739] border border-[#22304A] rounded-2xl max-w-md w-full p-6 space-y-4 text-xs text-white">
            <h3 className="text-base font-bold border-b border-[#22304A] pb-3">Log Maintenance Issue / Complaint</h3>
            <form onSubmit={handleNewComplaintSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Target Type *</label>
                  <select
                    value={newComplaint.targetType}
                    onChange={(e) => setNewComplaint({ ...newComplaint, targetType: e.target.value, targetId: "", targetName: "" })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  >
                    <option value="Room">Room</option>
                    <option value="Bed">Bed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Target Room *</label>
                  <select
                    required
                    value={newComplaint.targetId}
                    onChange={(e) => {
                      const sel = rooms.find((r) => (r._id || r.id) === e.target.value);
                      setNewComplaint({
                        ...newComplaint,
                        targetId: e.target.value,
                        targetName: sel ? `Room ${sel.roomNumber}` : "",
                      });
                    }}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  >
                    <option value="">Select Room</option>
                    {rooms.map((rm) => (
                      <option key={rm._id || rm.id} value={rm._id || rm.id}>
                        Room {rm.roomNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Issue Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the complaint or repair required..."
                  value={newComplaint.reason}
                  onChange={(e) => setNewComplaint({ ...newComplaint, reason: e.target.value })}
                  className="w-full bg-white/5 border border-[#22304A] rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Assigned Technician / Staff</label>
                <input
                  type="text"
                  placeholder="e.g. Electrician Ramesh"
                  value={newComplaint.performedBy}
                  onChange={(e) => setNewComplaint({ ...newComplaint, performedBy: e.target.value })}
                  className="w-full bg-white/5 border border-[#22304A] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewComplaintModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" disabled={submittingComplaint} className="w-1/2 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 cursor-pointer">
                  {submittingComplaint ? "Logging..." : "Log Issue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE CONFIRMATION */}
      <ConfirmDialog
        isOpen={Boolean(completeComplaintId)}
        onClose={() => setCompleteComplaintId(null)}
        onConfirm={confirmResolveComplaint}
        title="Resolve Complaint Ticket?"
        message="Are you sure you want to mark this maintenance ticket/complaint as completed?"
        confirmLabel="Mark Resolved"
        cancelLabel="Cancel"
      />
    </PageContainer>
  );
}
