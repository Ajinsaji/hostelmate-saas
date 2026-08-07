import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

import api from "../utils/apiClient";
import { useCurrentHostel } from "../contexts/HostelContext";
import { Badge } from "../design-system/components";

import useIsMobile from "../hooks/useIsMobile";
import ResidentsMobile from "./ResidentsMobile";
import ResidentsDesktop from "./ResidentsDesktop";

export default function Residents() {
  const { hostel } = useCurrentHostel();
  const activeHostelId = hostel?.id || hostel?._id;
  const isMobile = useIsMobile();

  // State hooks
  const [residents, setResidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const page = 1;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [formStep, setFormStep] = useState(0);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    gender: "Male",
    dateOfBirth: "",
    aadhaarNumber: "",
    guardianName: "",
    guardianPhone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    occupation: "Student",
    company: "",
    college: "",
    monthlyRent: "",
    securityDeposit: "",
    foodPreference: "Veg",
    roomId: "",
    bedId: "",
    status: "Pending Admission",
  });

  const fetchResidents = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...(search && { search }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterGender && { gender: filterGender }),
      });

      const [resData, statsData, roomsData] = await Promise.all([
        api.get(`/api/residents?${params.toString()}`),
        api.get("/api/residents/statistics"),
        api.get("/api/rooms"),
      ]);

      if (resData.data.success) {
        setResidents(resData.data.data?.residents || resData.data.residents || []);
      }

      if (statsData.data.success) {
        setStats(statsData.data.data);
      }

      if (roomsData.data.success) {
        setRooms(roomsData.data.rooms || []);
      }
    } catch (err) {
      console.warn("Failed to load residents.", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterGender]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents, activeHostelId]);

  const handleRoomSelect = (roomId) => {
    setForm((prev) => ({ ...prev, roomId, bedId: "" }));
    const selectedRoom = rooms.find((r) => r._id === roomId);
    if (selectedRoom) {
      const vacantBeds = (selectedRoom.beds || []).filter((b) => b.status === "Vacant");
      setAvailableBeds(vacantBeds);
    } else {
      setAvailableBeds([]);
    }
  };

  const handleFormSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.firstName || !form.phone) {
      return toast.error("First name and phone number are required.");
    }

    try {
      if (editingResident) {
        await api.put(`/api/residents/${editingResident._id}`, form);
        toast.success("Resident updated successfully!");
      } else {
        await api.post("/api/residents", form);
        toast.success("Resident registered successfully!");
      }
      setShowAddModal(false);
      setEditingResident(null);
      setFormStep(0);
      fetchResidents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resident?")) return;
    try {
      await api.delete(`/api/residents/${id}`);
      toast.success("Resident deleted.");
      fetchResidents();
    } catch (err) {
      toast.error("Failed to delete resident.");
    }
  };

  const renderStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    switch (s) {
      case "active":
      case "checkedin":
        return <Badge variant="success">Active</Badge>;
      case "pending":
      case "pending admission":
        return <Badge variant="warning">Pending</Badge>;
      case "checkedout":
      case "inactive":
        return <Badge variant="neutral">Checked Out</Badge>;
      default:
        return <Badge variant="neutral">{status || "Unknown"}</Badge>;
    }
  };

  if (isMobile) {
    return (
      <ResidentsMobile
        residents={residents}
        loading={loading}
        search={search}
        setSearch={setSearch}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterGender={filterGender}
        setFilterGender={setFilterGender}
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        form={form}
        setForm={setForm}
        rooms={rooms}
        availableBeds={availableBeds}
        handleRoomSelect={handleRoomSelect}
        handleFormSubmit={handleFormSubmit}
        handleDelete={handleDelete}
        setEditingResident={setEditingResident}
        setProfileData={setProfileData}
        setShowProfileDrawer={setShowProfileDrawer}
      />
    );
  }

  return (
    <ResidentsDesktop
      residents={residents}
      stats={stats}
      loading={loading}
      search={search}
      setSearch={setSearch}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      filterGender={filterGender}
      setFilterGender={setFilterGender}
      showAddModal={showAddModal}
      setShowAddModal={setShowAddModal}
      editingResident={editingResident}
      setEditingResident={setEditingResident}
      showProfileDrawer={showProfileDrawer}
      setShowProfileDrawer={setShowProfileDrawer}
      profileData={profileData}
      setProfileData={setProfileData}
      formStep={formStep}
      setFormStep={setFormStep}
      form={form}
      setForm={setForm}
      rooms={rooms}
      availableBeds={availableBeds}
      handleRoomSelect={handleRoomSelect}
      handleFormSubmit={handleFormSubmit}
      handleDelete={handleDelete}
      renderStatusBadge={renderStatusBadge}
    />
  );
}
