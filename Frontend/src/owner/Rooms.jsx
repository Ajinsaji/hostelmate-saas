import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

import api from "../utils/apiClient";
import { useCurrentHostel } from "../contexts/HostelContext";

import useIsMobile from "../hooks/useIsMobile";
import RoomsMobile from "./RoomsMobile";
import RoomsDesktop from "./RoomsDesktop";

export function Rooms() {
  const { hostel } = useCurrentHostel();
  const activeHostelId = hostel?.id || hostel?._id;
  const isMobile = useIsMobile();

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

  if (isMobile) {
    return (
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
    );
  }

  return (
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
  );
}

export default Rooms;
