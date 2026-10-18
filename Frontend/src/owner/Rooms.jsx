import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { BedDouble, Building2, Grid3X3 } from "lucide-react";

import api from "../utils/apiClient";
import { useCurrentHostel } from "../contexts/HostelContext";

import useIsMobile from "../hooks/useIsMobile";
import RoomsMobile from "./RoomsMobile";
import RoomsDesktop from "./RoomsDesktop";
import BuildingsFloorsManagement from "./BuildingsFloorsManagement";
import VisualFloorPlan from "./VisualFloorPlan";

export function Rooms() {
  const { hostel } = useCurrentHostel();
  const activeHostelId = hostel?.id || hostel?._id;
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState("rooms"); // 'rooms' | 'buildings' | 'matrix'

  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modals & Form Wizard
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [, setShowMaintenanceModal] = useState(false);
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
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
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

  return (
    <div className="space-y-6">
      {/* Top Operations Tabs */}
      <div className="flex border-b border-white/10 gap-2 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab("rooms")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeTab === "rooms"
              ? "bg-emerald-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <BedDouble className="w-4 h-4" />
          Rooms & Beds
        </button>

        <button
          onClick={() => setActiveTab("buildings")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeTab === "buildings"
              ? "bg-emerald-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Buildings & Floors
        </button>

        <button
          onClick={() => setActiveTab("matrix")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeTab === "matrix"
              ? "bg-emerald-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          Room & Bed Matrix
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "buildings" ? (
        <BuildingsFloorsManagement />
      ) : activeTab === "matrix" ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
          <VisualFloorPlan />
        </div>
      ) : isMobile ? (
        <RoomsMobile
          rooms={rooms}
          loading={loading}
          search={search}
          setSearch={setSearch}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          showAddRoomModal={showAddRoomModal}
          setShowAddRoomModal={setShowAddRoomModal}
          roomForm={roomForm}
          setRoomForm={setRoomForm}
          handleCreateRoom={handleCreateRoom}
          setSelectedRoom={setSelectedRoom}
          setShowDrawer={setShowDrawer}
        />
      ) : (
        <RoomsDesktop
          rooms={rooms}
          loading={loading}
          search={search}
          setSearch={setSearch}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          showAddRoomModal={showAddRoomModal}
          setShowAddRoomModal={setShowAddRoomModal}
          roomForm={roomForm}
          setRoomForm={setRoomForm}
          handleCreateRoom={handleCreateRoom}
          setSelectedRoom={setSelectedRoom}
          setShowDrawer={setShowDrawer}
          showDrawer={showDrawer}
          selectedRoom={selectedRoom}
          roomStep={roomStep}
          setRoomStep={setRoomStep}
          setShowMaintenanceModal={setShowMaintenanceModal}
        />
      )}
    </div>
  );
}

export default Rooms;
