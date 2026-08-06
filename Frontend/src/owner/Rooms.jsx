import { useTheme } from "../design-system/ThemeProvider";
import React, { useState, useEffect } from "react";
import {
  Building2,
  Layers,
  BedDouble,
  Plus,
  Search,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { CardGrid } from "../design-system/layouts/CardGrid";
import { Button } from "../design-system/components/Button";
import FilterChip from "../design-system/components/FilterChip";
import { KPICard } from "../design-system/components/KPICard";
import RoomCard from "../design-system/components/RoomCard";
import RoomDetailsDrawer from "../design-system/components/RoomDetailsDrawer";
import { AISearchBar } from "../design-system/components/AISearchBar";
import { EmptyState } from "../design-system/components/EmptyState";
import { LoadingSkeleton } from "../design-system/components/LoadingSkeleton";
import { useCurrentHostel } from "../contexts/HostelContext";

function RoomTable({ rooms, onAction }) {
  return (
    <div className="overflow-x-auto rounded-2xl border animate-fade-in" style={{ borderColor: '#22304A', background: '#162032' }}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b" style={{ borderColor: '#22304A', background: 'rgba(255,255,255,0.02)' }}>
            <th className="p-4 text-xs font-bold text-slate-400 uppercase">Room Number</th>
            <th className="p-4 text-xs font-bold text-slate-400 uppercase">Room Type</th>
            <th className="p-4 text-xs font-bold text-slate-400 uppercase">Occupancy Status</th>
            <th className="p-4 text-xs font-bold text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map(room => (
            <tr key={room._id} className="border-b hover:bg-white/5 transition" style={{ borderColor: '#22304A' }}>
              <td className="p-4 font-semibold text-white">Room {room.roomNumber}</td>
              <td className="p-4 text-sm text-white capitalize">{room.roomType || 'Standard'}</td>
              <td className="p-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  room.occupiedBeds >= room.totalBeds ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                }`}>
                  Occupied: {room.occupiedBeds || 0} / {room.totalBeds || 1}
                </span>
              </td>
              <td className="p-4">
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => onAction('view', room)} size="sm">Details</Button>
                  <Button variant="secondary" onClick={() => onAction('maintenance', room)} size="sm">Maintenance</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Rooms = () => {
  const { colors } = useTheme();
  const { hostel } = useCurrentHostel();
  const activeHostelId = hostel?.id || hostel?._id;

  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
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
  const [filterBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRoomType] = useState("");

  // Modals
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
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

  const [maintenanceForm, setMaintenanceForm] = useState({
    targetType: "Room",
    targetId: "",
    reason: "",
    expectedCompletion: "",
    cost: 0,
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [activeHostelId]);

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

  const handleCreateMaintenance = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/maintenance", maintenanceForm);
      toast.success("Maintenance log recorded");
      setShowMaintenanceModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create log");
    }
  };

  // Local filter computation
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(search.toLowerCase());
    const matchesBuilding = filterBuilding ? room.buildingId?._id === filterBuilding || room.buildingId === filterBuilding : true;
    const matchesRoomType = filterRoomType ? room.roomType === filterRoomType : true;
    
    let matchesStatus = true;
    if (filterStatus === "occupied") {
      matchesStatus = room.occupiedBeds >= room.totalBeds;
    } else if (filterStatus === "vacant") {
      matchesStatus = room.occupiedBeds < room.totalBeds;
    }
    
    return matchesSearch && matchesBuilding && matchesRoomType && matchesStatus;
  });

  return (
    <OwnerLayout>
      <PageContainer>
        {/* Top Header Controls */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Room Allocation</h1>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="primary" 
                onClick={() => {
                  setRoomForm({
                    roomNumber: "",
                    buildingId: buildings[0]?._id || "",
                    floorId: floors[0]?._id || "",
                    roomType: "Double",
                    gender: "Male",
                    capacity: 2,
                    monthlyRent: 7500,
                    securityDeposit: 5000,
                    amenities: ["WiFi", "Study Table", "Cupboard"],
                  });
                  setShowAddRoomModal(true);
                }}
              >
                + Add Room
              </Button>
            </div>
          </div>

          <AISearchBar 
            placeholder="Ask AI about rooms (e.g. 'Show vacant double sharing rooms in Block A')..."
            onSearch={(q) => console.log('AI Search:', q)}
          />

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search rooms by number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C4CF5]/20 focus:border-[#6C4CF5] transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <FilterChip 
              label="All Rooms" 
              isActive={!filterStatus} 
              onClick={() => setFilterStatus("")}
              count={rooms.length}
            />
            <FilterChip 
              label="Fully Occupied" 
              isActive={filterStatus === "occupied"} 
              onClick={() => setFilterStatus("occupied")}
            />
            <FilterChip 
              label="Vacant beds" 
              isActive={filterStatus === "vacant"} 
              onClick={() => setFilterStatus("vacant")}
            />
          </div>
        </div>

        {/* Room Statistics */}
        {roomStats && bedStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <KPICard title="Total Rooms" value={roomStats.totalRooms || 0} icon={Layers} color="blue" />
            <KPICard title="Total Beds Available" value={bedStats.totalBeds || 0} icon={BedDouble} color="emerald" />
            <KPICard title="Occupied Beds" value={bedStats.occupiedBeds || 0} icon={CheckCircle2} color="amber" />
            <KPICard title="Vacant Beds" value={bedStats.vacantBeds || 0} icon={Building2} color="rose" />
          </div>
        )}

        {/* Room List toggle */}
        {loading ? (
          <CardGrid>
            {[1,2,3,4,5,6].map(i => <LoadingSkeleton key={i} type="card" />)}
          </CardGrid>
        ) : filteredRooms.length === 0 ? (
          <EmptyState 
            title="No Rooms Found"
            description="No rooms match your selected filters."
            icon={BedDouble}
            action={{ label: "Clear Filters", onClick: () => { setSearch(""); setFilterStatus(""); } }}
          />
        ) : (
          <>
            {isMobile ? (
              <CardGrid>
                {filteredRooms.map(room => (
                  <RoomCard 
                    key={room._id} 
                    room={room} 
                    onAction={(action, r) => {
                      if (action === 'view') {
                        setSelectedRoom(r);
                        setShowDrawer(true);
                      } else if (action === 'maintenance') {
                        setMaintenanceForm({ targetType: "Room", targetId: r._id, reason: "", cost: 0, expectedCompletion: "" });
                        setShowMaintenanceModal(true);
                      }
                    }}
                    onClick={(r) => {
                      setSelectedRoom(r);
                      setShowDrawer(true);
                    }}
                  />
                ))}
              </CardGrid>
            ) : (
              <RoomTable 
                rooms={filteredRooms}
                colors={colors}
                onAction={(action, r) => {
                  if (action === 'view') {
                    setSelectedRoom(r);
                    setShowDrawer(true);
                  } else if (action === 'maintenance') {
                    setMaintenanceForm({ targetType: "Room", targetId: r._id, reason: "", cost: 0, expectedCompletion: "" });
                    setShowMaintenanceModal(true);
                  }
                }}
              />
            )}
          </>
        )}

        {/* Room Details Drawer */}
        <RoomDetailsDrawer 
          isOpen={showDrawer}
          onClose={() => setShowDrawer(false)}
          room={selectedRoom}
          beds={beds.filter(b => b.roomId?._id === selectedRoom?._id || b.roomId === selectedRoom?._id)}
          maintenanceLogs={maintenanceLogs.filter(m => m.targetId?._id === selectedRoom?._id || m.targetId === selectedRoom?._id)}
          onAction={(action) => {
             if (action === 'maintenance') {
                setMaintenanceForm({ targetType: "Room", targetId: selectedRoom._id, reason: "", cost: 0, expectedCompletion: "" });
                setShowMaintenanceModal(true);
             }
          }}
        />

        {/* Create Room Modal */}
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
                  <label className="block text-slate-400 font-bold mb-1">Room Type</label>
                  <select
                    value={roomForm.roomType}
                    onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  >
                    <option value="Single" className="bg-slate-900">Single Sharing</option>
                    <option value="Double" className="bg-slate-900">Double Sharing</option>
                    <option value="Triple" className="bg-slate-900">Triple Sharing</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddRoomModal(false)}
                    className="w-1/2 py-3 rounded-xl font-bold bg-white/10 text-slate-350"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 rounded-xl font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  >
                    Create Room
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Maintenance Modal */}
        {showMaintenanceModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Log Maintenance Request</h3>
              <form onSubmit={handleCreateMaintenance} className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Issue Description *</label>
                  <input
                    type="text"
                    required
                    value={maintenanceForm.reason}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, reason: e.target.value })}
                    placeholder="e.g. AC leaking, Water faucet broken"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={maintenanceForm.cost}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowMaintenanceModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="w-1/2 py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-400">Log Request</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </PageContainer>
    </OwnerLayout>
  );
};

export default Rooms;
