import React, { useState, useEffect } from "react";
import {
  Building2,
  Layers,
  BedDouble,
  Plus,
  Search,
  Filter,
  Wrench,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Edit,
  Grid,
  List,
  Shield,
  Activity,
  ArrowRight,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import VisualFloorPlan from "./VisualFloorPlan";

export const Rooms = () => {
  const [activeTab, setActiveTab] = useState("rooms"); // rooms | buildings | floorplan | maintenance
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [beds, setBeds] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);

  const [roomStats, setRoomStats] = useState(null);
  const [bedStats, setBedStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRoomType, setFilterRoomType] = useState("");

  // Modals
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showAddBuildingModal, setShowAddBuildingModal] = useState(false);
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  // Forms
  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    buildingId: "",
    floorId: "",
    roomType: "Double",
    gender: "Male",
    capacity: 2,
    monthlyRent: 7500,
    securityDeposit: 5000,
    amenities: ["WiFi", "Study Table", "Cupboard"],
  });

  const [buildingForm, setBuildingForm] = useState({
    buildingName: "",
    buildingCode: "",
    description: "",
    address: "",
  });

  const [floorForm, setFloorForm] = useState({
    buildingId: "",
    floorName: "",
    floorNumber: 1,
    description: "",
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    targetType: "Room",
    targetId: "",
    reason: "",
    expectedCompletion: "",
    cost: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rRes, bRes, fRes, bedRes, rStats, bStats, mRes] = await Promise.all([
        api.get("/api/rooms"),
        api.get("/api/buildings"),
        api.get("/api/floors"),
        api.get("/api/beds"),
        api.get("/api/rooms/statistics"),
        api.get("/api/beds/statistics"),
        api.get("/api/maintenance"),
      ]);

      if (rRes.data?.rooms) setRooms(rRes.data.rooms);
      if (bRes.data?.buildings) setBuildings(bRes.data.buildings);
      if (fRes.data?.floors) setFloors(fRes.data.floors);
      if (bedRes.data?.beds) setBeds(bedRes.data.beds);
      if (rStats.data?.success) setRoomStats(rStats.data);
      if (bStats.data?.success) setBedStats(bStats.data);
      if (mRes.data?.logs) setMaintenanceLogs(mRes.data.logs);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load room management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/rooms", roomForm);
      toast.success("Room created with auto-generated beds!");
      setShowAddRoomModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create room");
    }
  };

  const handleCreateBuilding = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/buildings", buildingForm);
      toast.success("Building created!");
      setShowAddBuildingModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create building");
    }
  };

  const handleCreateFloor = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/floors", floorForm);
      toast.success("Floor created!");
      setShowAddFloorModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create floor");
    }
  };

  const handleCreateMaintenance = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/maintenance", maintenanceForm);
      toast.success("Maintenance logged!");
      setShowMaintenanceModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to log maintenance");
    }
  };

  const handleCompleteMaintenance = async (logId) => {
    try {
      await api.patch(`/api/maintenance/${logId}/complete`);
      toast.success("Maintenance marked completed");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Completion failed");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await api.delete(`/api/rooms/${roomId}`);
      toast.success("Room soft deleted");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const matchSearch = !search || r.roomNumber.toLowerCase().includes(search.toLowerCase());
    const matchBuilding = !filterBuilding || r.buildingId?._id === filterBuilding || r.buildingId === filterBuilding;
    const matchStatus = !filterStatus || r.status === filterStatus;
    const matchType = !filterRoomType || r.roomType === filterRoomType;
    return matchSearch && matchBuilding && matchStatus && matchType;
  });

  return (
    <div className="min-h-screen bg-[#081028] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <BedDouble className="text-emerald-400" /> Enterprise Room & Bed Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Building & floor hierarchy, automatic bed capacity generation, visual floor plans, and maintenance tracking.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddBuildingModal(true)}
              className="bg-white/10 hover:bg-white/20 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Building2 className="w-4 h-4" /> Add Building
            </button>
            <button
              onClick={() => setShowAddFloorModal(true)}
              className="bg-white/10 hover:bg-white/20 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Layers className="w-4 h-4" /> Add Floor
            </button>
            <button
              onClick={() => setShowAddRoomModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              <Plus className="w-4 h-4" /> Create Room
            </button>
          </div>
        </div>

        {/* Statistics KPI Cards */}
        {roomStats && bedStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Buildings</span>
              <div className="text-xl font-black text-white mt-1">{buildings.length}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Floors</span>
              <div className="text-xl font-black text-white mt-1">{floors.length}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Rooms</span>
              <div className="text-xl font-black text-white mt-1">{roomStats.totalRooms}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Beds</span>
              <div className="text-xl font-black text-white mt-1">{bedStats.totalBeds}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Occupied</span>
              <div className="text-xl font-black text-emerald-400 mt-1">{bedStats.occupiedBeds}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Vacant</span>
              <div className="text-xl font-black text-blue-400 mt-1">{bedStats.vacantBeds}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Maintenance</span>
              <div className="text-xl font-black text-amber-400 mt-1">{bedStats.maintenanceBeds}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Occupancy %</span>
              <div className="text-xl font-black text-teal-400 mt-1">{bedStats.occupancyRate}%</div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 text-xs font-bold gap-6">
          <button
            onClick={() => setActiveTab("rooms")}
            className={`pb-3 border-b-2 transition ${activeTab === "rooms" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Rooms & Beds List
          </button>
          <button
            onClick={() => setActiveTab("floorplan")}
            className={`pb-3 border-b-2 transition ${activeTab === "floorplan" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Visual Floor Plan
          </button>
          <button
            onClick={() => setActiveTab("buildings")}
            className={`pb-3 border-b-2 transition ${activeTab === "buildings" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Buildings & Floors ({buildings.length})
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`pb-3 border-b-2 transition ${activeTab === "maintenance" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Maintenance Log ({maintenanceLogs.length})
          </button>
        </div>

        {/* TAB 1: ROOMS LIST */}
        {activeTab === "rooms" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search room number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
                <select
                  value={filterBuilding}
                  onChange={(e) => setFilterBuilding(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="" className="bg-slate-900">All Buildings</option>
                  {buildings.map((b) => (
                    <option key={b._id} value={b._id} className="bg-slate-900">{b.buildingName}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="" className="bg-slate-900">All Statuses</option>
                  <option value="Vacant" className="bg-slate-900">Vacant</option>
                  <option value="Partially Occupied" className="bg-slate-900">Partially Occupied</option>
                  <option value="Fully Occupied" className="bg-slate-900">Fully Occupied</option>
                  <option value="Under Maintenance" className="bg-slate-900">Under Maintenance</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-slate-400 font-bold uppercase border-b border-white/10">
                  <tr>
                    <th className="p-4">Room #</th>
                    <th className="p-4">Building & Floor</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Beds (Occupied/Total)</th>
                    <th className="p-4">Rent (₹)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredRooms.length > 0 ? (
                    filteredRooms.map((room) => (
                      <tr key={room._id} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-bold text-white">Room {room.roomNumber}</td>
                        <td className="p-4">
                          <div>{room.buildingId?.buildingName || "Default Building"}</div>
                          <div className="text-[10px] text-slate-400">Floor {room.floor || "1"}</div>
                        </td>
                        <td className="p-4">{room.roomType}</td>
                        <td className="p-4">
                          <span className="font-bold text-emerald-400">{room.occupiedBeds}</span> / {room.capacity}
                        </td>
                        <td className="p-4 font-bold text-white">₹{room.monthlyRent || room.rentPerBed}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            room.status === "Vacant" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                            room.status === "Fully Occupied" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                            room.status === "Partially Occupied" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" :
                            "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          }`}>
                            {room.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setMaintenanceForm({ targetType: "Room", targetId: room._id, reason: "", cost: 0 });
                                setShowMaintenanceModal(true);
                              }}
                              className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg"
                              title="Maintenance"
                            >
                              <Wrench className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room._id)}
                              className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg"
                              title="Soft Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">No rooms found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: VISUAL FLOOR PLAN */}
        {activeTab === "floorplan" && <VisualFloorPlan />}

        {/* TAB 3: BUILDINGS & FLOORS */}
        {activeTab === "buildings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="text-emerald-400" /> Buildings List
              </h3>
              <div className="space-y-2">
                {buildings.map((b) => (
                  <div key={b._id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">{b.buildingName} ({b.buildingCode})</div>
                      <div className="text-[10px] text-slate-400">{b.address || "Main Address"}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">{b.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="text-blue-400" /> Floors List
              </h3>
              <div className="space-y-2">
                {floors.map((f) => (
                  <div key={f._id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">{f.floorName} (Floor #{f.floorNumber})</div>
                      <div className="text-[10px] text-slate-400">{f.buildingId?.buildingName || "Building"}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 font-bold">{f.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MAINTENANCE LOG */}
        {activeTab === "maintenance" && (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Wrench className="text-amber-400" /> Maintenance Audit & Execution History
              </h3>
              <button
                onClick={() => setShowMaintenanceModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Log Maintenance
              </button>
            </div>

            <div className="space-y-3">
              {maintenanceLogs.map((log) => (
                <div key={log._id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">{log.targetType} Maintenance - {log.reason}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Started: {new Date(log.startDate).toLocaleDateString()} • Cost: ₹{log.cost}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.status === "Completed" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                      {log.status}
                    </span>
                    {log.status !== "Completed" && (
                      <button
                        onClick={() => handleCompleteMaintenance(log._id)}
                        className="p-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded"
                        title="Mark Complete"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Create New Room</h3>
            <form onSubmit={handleCreateRoom} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Room Number *</label>
                <input
                  type="text"
                  required
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  placeholder="e.g. 101"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Building</label>
                <select
                  value={roomForm.buildingId}
                  onChange={(e) => setRoomForm({ ...roomForm, buildingId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="" className="bg-slate-900">Select Building</option>
                  {buildings.map((b) => <option key={b._id} value={b._id} className="bg-slate-900">{b.buildingName}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Room Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    required
                    value={roomForm.monthlyRent}
                    onChange={(e) => setRoomForm({ ...roomForm, monthlyRent: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowAddRoomModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400">Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Building Modal */}
      {showAddBuildingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Add Building</h3>
            <form onSubmit={handleCreateBuilding} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Building Name *</label>
                <input
                  type="text"
                  required
                  value={buildingForm.buildingName}
                  onChange={(e) => setBuildingForm({ ...buildingForm, buildingName: e.target.value })}
                  placeholder="e.g. Block A"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Building Code *</label>
                <input
                  type="text"
                  required
                  value={buildingForm.buildingCode}
                  onChange={(e) => setBuildingForm({ ...buildingForm, buildingCode: e.target.value })}
                  placeholder="e.g. BLK-A"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowAddBuildingModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400">Save Building</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Floor Modal */}
      {showAddFloorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Add Floor</h3>
            <form onSubmit={handleCreateFloor} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Building *</label>
                <select
                  required
                  value={floorForm.buildingId}
                  onChange={(e) => setFloorForm({ ...floorForm, buildingId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="" className="bg-slate-900">-- Choose Building --</option>
                  {buildings.map((b) => <option key={b._id} value={b._id} className="bg-slate-900">{b.buildingName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Floor Name *</label>
                <input
                  type="text"
                  required
                  value={floorForm.floorName}
                  onChange={(e) => setFloorForm({ ...floorForm, floorName: e.target.value })}
                  placeholder="e.g. Ground Floor"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Floor Number *</label>
                <input
                  type="number"
                  required
                  value={floorForm.floorNumber}
                  onChange={(e) => setFloorForm({ ...floorForm, floorNumber: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowAddFloorModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400">Save Floor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Log Maintenance</h3>
            <form onSubmit={handleCreateMaintenance} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Target Type</label>
                <select
                  value={maintenanceForm.targetType}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, targetType: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="Room" className="bg-slate-900">Room</option>
                  <option value="Bed" className="bg-slate-900">Bed</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Maintenance Reason *</label>
                <input
                  type="text"
                  required
                  value={maintenanceForm.reason}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, reason: e.target.value })}
                  placeholder="e.g. AC Repair, Plumbing"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowMaintenanceModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400">Log Maintenance</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Rooms;
