import React, { useState, useEffect, useCallback } from "react";
import {
  BedDouble,
  Building2,
  Plus,
  Wrench,
  IndianRupee,
  CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../utils/apiClient";
import { useTheme } from "../design-system/ThemeProvider";
import { useCurrentHostel } from "../contexts/HostelContext";
import {
  Card,
  MetricCard,
  Button,
  Badge,
  Input,
  SearchBox,
  SkeletonLoader,
  EmptyState,
  Modal,
  Drawer,
  FormWizard
} from "../design-system/components";

export function Rooms() {
  const { colors, typography } = useTheme();
  const { hostel } = useCurrentHostel();
  const activeHostelId = hostel?.id || hostel?._id;

  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modals & Form Wizard
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [roomStep, setRoomStep] = useState(0);

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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rRes] = await Promise.all([
        api.get("/api/rooms"),
      ]);

      if (rRes.data?.rooms) setRooms(rRes.data.rooms);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, activeHostelId]);

  const handleCreateRoom = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!roomForm.roomNumber) {
      return toast.error("Room number is required");
    }

    try {
      await api.post("/api/rooms", roomForm);
      toast.success("Room created successfully!");
      setShowAddRoomModal(false);
      setRoomStep(0);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create room.");
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = !search || r.roomNumber.toString().includes(search);
    const isFull = (r.occupiedBeds || 0) >= (r.totalBeds || 1);
    const matchesStatus = !filterStatus || (filterStatus === "Occupied" && isFull) || (filterStatus === "Vacant" && !isFull);
    return matchesSearch && matchesStatus;
  });

  const wizardSteps = [
    { id: "room-details", title: "Room & Capacity", description: "Room number, type & gender allocation" },
    { id: "pricing", title: "Rent & Deposit", description: "Monthly rent rate and security deposit" },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 style={{ fontSize: typography.sizes["2xl"] || "24px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
            Room & Space Directory
          </h1>
          <p style={{ fontSize: typography.sizes.sm || "14px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            Visual floor plan, room occupancies, and bed allocations
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={() => { setRoomStep(0); setShowAddRoomModal(true); }}>
          Add Room
        </Button>
      </div>

      {/* 2. Key Metrics (Max 4 KPI Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Total Rooms"
          value={(rooms.length || 0).toString()}
          icon={Building2}
        />
        <MetricCard
          title="Fully Occupied"
          value={rooms.filter((r) => (r.occupiedBeds || 0) >= (r.totalBeds || 1)).length.toString()}
          icon={CheckCircle2}
          trend="Occupied"
          trendDirection="up"
        />
        <MetricCard
          title="Vacant Rooms"
          value={rooms.filter((r) => (r.occupiedBeds || 0) < (r.totalBeds || 1)).length.toString()}
          icon={BedDouble}
          trend="Available"
          trendDirection="neutral"
        />
        <MetricCard
          title="Est. Monthly Rent"
          value={`₹${(rooms.reduce((acc, r) => acc + (r.monthlyRent || 7500), 0)).toLocaleString()}`}
          icon={IndianRupee}
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBox
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by room number..."
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border text-xs font-bold bg-[#1A2438] text-white"
          style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
        >
          <option value="">All Occupancies</option>
          <option value="Occupied">Fully Occupied</option>
          <option value="Vacant">Has Vacancies</option>
        </select>
      </div>

      {/* 4. Room Grid Cards Layout */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <SkeletonLoader key={n} height="160px" />
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <EmptyState
          title="No Rooms Found"
          description="Start building your hostel setup by adding your first room."
          action={{
            label: "Add Room",
            onClick: () => setShowAddRoomModal(true)
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => {
            const isFull = (room.occupiedBeds || 0) >= (room.totalBeds || room.capacity || 2);
            return (
              <Card
                key={room._id}
                hover
                onClick={() => { setSelectedRoom(room); setShowDrawer(true); }}
                className="w-full"
                padding="md"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 style={{ fontSize: typography.sizes.md || "16px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
                      Room {room.roomNumber}
                    </h3>
                    <span style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8" }}>
                      {room.roomType || "Standard Double"} • {room.gender || "Co-Living"}
                    </span>
                  </div>

                  <Badge variant={isFull ? "danger" : "success"}>
                    {isFull ? "Occupied" : "Vacant Beds"}
                  </Badge>
                </div>

                <div className="space-y-2 pt-3 border-t" style={{ borderColor: colors.border.default || "#202B45" }}>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: colors.text.secondary || "#94A3B8" }}>Bed Occupancy</span>
                    <span style={{ fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF" }}>
                      {room.occupiedBeds || 0} / {room.totalBeds || room.capacity || 2} Occupied
                    </span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span style={{ color: colors.text.secondary || "#94A3B8" }}>Monthly Rent</span>
                    <span style={{ fontWeight: typography.weights.bold, color: colors.accent.success || "#22C55E" }}>
                      ₹{(room.monthlyRent || 7500).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 5. Progressive Add Room Form Wizard Modal */}
      <Modal
        isOpen={showAddRoomModal}
        onClose={() => setShowAddRoomModal(false)}
        title="Add New Room"
      >
        <FormWizard
          steps={wizardSteps}
          currentStep={roomStep}
          onStepChange={setRoomStep}
          onSubmit={handleCreateRoom}
        >
          {roomStep === 0 && (
            <div className="space-y-3">
              <Input
                label="Room Number *"
                required
                placeholder="e.g. 101"
                value={roomForm.roomNumber}
                onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Room Type</label>
                  <select
                    value={roomForm.roomType}
                    onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                    className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white"
                    style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
                  >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Triple">Triple</option>
                    <option value="Dormitory">Dormitory</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Gender</label>
                  <select
                    value={roomForm.gender}
                    onChange={(e) => setRoomForm({ ...roomForm, gender: e.target.value })}
                    className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white"
                    style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Co-Living">Co-Living</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {roomStep === 1 && (
            <div className="space-y-3">
              <Input
                label="Monthly Rent (₹)"
                type="number"
                value={roomForm.monthlyRent}
                onChange={(e) => setRoomForm({ ...roomForm, monthlyRent: e.target.value })}
              />
              <Input
                label="Security Deposit (₹)"
                type="number"
                value={roomForm.securityDeposit}
                onChange={(e) => setRoomForm({ ...roomForm, securityDeposit: e.target.value })}
              />
            </div>
          )}
        </FormWizard>
      </Modal>

      {/* 6. Room Details Drawer */}
      <Drawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        title={selectedRoom ? `Room ${selectedRoom.roomNumber} Details` : "Room Details"}
      >
        {selectedRoom && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: colors.border.default || "#202B45" }}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white">Room {selectedRoom.roomNumber}</h3>
                <Badge variant={(selectedRoom.occupiedBeds || 0) >= (selectedRoom.totalBeds || 2) ? "danger" : "success"}>
                  {selectedRoom.occupiedBeds || 0} / {selectedRoom.totalBeds || 2} Occupied
                </Badge>
              </div>
              <p className="text-xs text-slate-400">{selectedRoom.roomType || "Standard Double"} • {selectedRoom.gender || "Co-Living"}</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-3 rounded-xl bg-white/[0.02]">
                <span className="text-slate-400">Monthly Rent</span>
                <span className="font-bold text-emerald-400">₹{(selectedRoom.monthlyRent || 7500).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-white/[0.02]">
                <span className="text-slate-400">Security Deposit</span>
                <span className="font-bold text-white">₹{(selectedRoom.securityDeposit || 5000).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4">
              <Button variant="secondary" fullWidth icon={Wrench} onClick={() => { setShowDrawer(false); setShowMaintenanceModal(true); }}>
                Log Maintenance Issue
              </Button>
            </div>
          </div>
        )}
      </Drawer>

    </div>
  );
}

export default Rooms;
