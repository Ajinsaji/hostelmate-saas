import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import {
  Plus,
  Search,
  BedDouble,
  Phone,
  X,
  Info,
  CreditCard,
  Calendar,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import BottomNav from "../components/BottomNav";
import { getOccupancyStyle, getOccupancyState } from "../utils/occupancyStyles";
import { subscribeOccupancyRefresh, triggerOccupancyRefresh } from "../utils/occupancyRefresh";


const PHONE_REGEX = /^[0-9]{10}$/;

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [residents, setResidents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchRoomNumber, setSearchRoomNumber] = useState("");
  const [occupancyFilter, setOccupancyFilter] = useState("all");
  const [roomFormOpen, setRoomFormOpen] = useState(false);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [residentModalOpen, setResidentModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedResidentId, setSelectedResidentId] = useState(null);

  const [residentDetails, setResidentDetails] = useState(null);
  const [residentPayments, setResidentPayments] = useState([]);

  const [assignLoading, setAssignLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [residentLoading, setResidentLoading] = useState(false);
  const [roomSaving, setRoomSaving] = useState(false);


  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    totalBeds: "",
    floor: "",
    roomType: "",
    rentPerBed: "",
  });
  const [editingRoom, setEditingRoom] = useState(null);

  const [assignForm, setAssignForm] = useState({
    name: "",
    phone: "",
    monthlyRent: "",
    depositAmount: "",
    joinDate: new Date().toISOString().slice(0, 10),
  });
  const [assignError, setAssignError] = useState("");

  const getRoomStats = (room) => {
    const beds = room?.beds || [];
    const totalBeds = Number(room.totalBeds ?? beds.length) || beds.length || 0;
    const occupiedBeds = Number(room.occupiedBeds ?? beds.filter((bed) => String(bed?.status).toLowerCase() === "occupied").length) || 0;
    const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
    const pct = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    return { totalBeds, occupiedBeds, vacantBeds, pct, beds };
  };

  const residentMapById = useMemo(() => {
    return residents.reduce((acc, resident) => {
      if (resident?._id) acc[resident._id] = resident;
      return acc;
    }, {});
  }, [residents]);

  const residentMapByBedId = useMemo(() => {
    return residents.reduce((acc, resident) => {
      if (resident?.bedId) acc[resident.bedId] = resident;
      return acc;
    }, {});
  }, [residents]);

  const roomNumberById = useMemo(() => {
    return rooms.reduce((acc, room) => {
      if (room?._id) acc[room._id] = room.roomNumber;
      return acc;
    }, {});
  }, [rooms]);

  const bedNumberById = useMemo(() => {
    return rooms.reduce((acc, room) => {
      (room?.beds || []).forEach((bed) => {
        if (bed?._id) acc[bed._id] = bed.bedNumber;
      });
      return acc;
    }, {});
  }, [rooms]);

  const parseMonthString = (month) => {
    if (!month) return null;
    const cleaned = String(month).trim();
    if (/^\d{4}-\d{2}$/.test(cleaned)) {
      return new Date(`${cleaned}-01`);
    }
    const parsed = Date.parse(cleaned);
    return Number.isNaN(parsed) ? null : new Date(parsed);
  };

  const paymentSummaryByResidentId = useMemo(() => {
    return payments.reduce((acc, payment) => {
      const id = payment?.residentId?.toString();
      if (!id) return acc;
      const existing = acc[id];
      const currentDate = parseMonthString(payment?.month) || new Date(payment?.createdAt || payment?.updatedAt || Date.now());
      if (!existing || currentDate > existing.monthDate) {
        acc[id] = { ...payment, monthDate: currentDate };
      }
      return acc;
    }, {});
  }, [payments]);

  const formatMoney = (value) => {
    const amount = Number(value ?? 0);
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatDate = (value) => {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getInitials = (name) => {
    if (!name) return "-";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  };

  const getPaymentBadge = (status) => {
    if (!status) return { label: "Pending", color: "rgba(250,204,21,0.14)", border: "rgba(250,204,21,0.25)" };
    if (status === "paid") return { label: "Paid", color: "rgba(34,197,94,0.14)", border: "rgba(34,197,94,0.3)" };
    if (status === "partial") return { label: "Partial", color: "rgba(59,130,246,0.14)", border: "rgba(59,130,246,0.3)" };
    return { label: "Overdue", color: "rgba(239,68,68,0.14)", border: "rgba(239,68,68,0.3)" };
  };

  const occupancyStyleForBed = (bed) => {
    return getOccupancyStyle(bed?.status);
  };

  // Normalize occupied/vacant handling for all bed UI
  const isBedVacant = (bed) => {
    return getOccupancyState(bed?.status) === "vacant";
  };



  const filteredRooms = useMemo(() => {
    return rooms
      .filter((room) => {
        if (!searchRoomNumber.trim()) return true;
        return String(room.roomNumber).toLowerCase().includes(searchRoomNumber.trim().toLowerCase());
      })
      .filter((room) => {
        if (occupancyFilter === "all") return true;
        const { totalBeds, occupiedBeds } = getRoomStats(room);
        if (occupancyFilter === "vacant") return occupiedBeds === 0;
        if (occupancyFilter === "full") return occupiedBeds === totalBeds;
        if (occupancyFilter === "partial") return occupiedBeds > 0 && occupiedBeds < totalBeds;
        return true;
      });
  }, [rooms, searchRoomNumber, occupancyFilter]);

  const currentRoomOccupancySummary = useMemo(() => {
    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((sum, room) => sum + (Number(room.totalBeds) || (room.beds?.length || 0)), 0);
    const totalOccupied = rooms.reduce(
      (sum, room) => sum + Number(room.occupiedBeds ?? (room.beds?.filter((bed) => String(bed?.status).toLowerCase() === "occupied").length || 0)),
      0
    );
    return { totalRooms, totalBeds, totalOccupied, totalVacant: Math.max(0, totalBeds - totalOccupied) };
  }, [rooms]);

  const getDueDateLabel = (payment, joinDate) => {
    const monthDate = parseMonthString(payment?.month);
    const base = monthDate || (joinDate ? new Date(joinDate) : null);
    if (!base) return "Not available";
    const due = new Date(base.getTime());
    due.setMonth(due.getMonth() + 1);
    return formatDate(due);
  };

  const getDaysFromDue = (payment, joinDate) => {
    const monthDate = parseMonthString(payment?.month);
    const base = monthDate || (joinDate ? new Date(joinDate) : null);
    if (!base) return null;
    const due = new Date(base.getTime());
    due.setMonth(due.getMonth() + 1);
    const diff = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const loadData = async () => {
    // keep UI responsive and avoid stale occupancy state
    setLoading(true);
    try {
      const [roomsRes, residentsRes, paymentsRes] = await Promise.all([
        api.get("/api/rooms/get-rooms"),
        api.get("/api/residents/hostel"),
        api.get("/api/payments/hostel"),
      ]);
      setRooms(roomsRes.data?.rooms || []);
      setResidents(residentsRes.data?.residents || []);
      setPayments(paymentsRes.data?.payments || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load room data.");
    } finally {
      setLoading(false);
    }
  };

  const refreshOccupancyUI = async () => {
    // used after assign/checkout for immediate consistency
    try {
      const [roomsRes, residentsRes, paymentsRes] = await Promise.all([
        api.get("/api/rooms/get-rooms"),
        api.get("/api/residents/hostel"),
        api.get("/api/payments/hostel"),
      ]);
      setRooms(roomsRes.data?.rooms || []);
      setResidents(residentsRes.data?.residents || []);
      setPayments(paymentsRes.data?.payments || []);

      // Broadcast after any local occupancy refresh so other screens sync immediately.
      triggerOccupancyRefresh("rooms-screen-refresh");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to refresh occupancy.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssignModal = (room, bed) => {
    if (!room?._id || !bed?._id) {
      toast.error("Invalid room or bed selected.");
      return;
    }
    setSelectedRoom(room);
    setSelectedBed(bed);
    setAssignForm({
      name: "",
      phone: "",
      monthlyRent: room.rentPerBed ? String(room.rentPerBed) : "",
      depositAmount: "",
      joinDate: new Date().toISOString().slice(0, 10),
    });
    setAssignError("");
    setAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    if (assignLoading) return;
    setAssignModalOpen(false);
    setSelectedRoom(null);
    setSelectedBed(null);
  };

  const validateAssignForm = () => {
    if (!assignForm.name.trim()) return "Resident name is required.";
    if (!assignForm.phone.trim()) return "Phone number is required.";
    if (!PHONE_REGEX.test(assignForm.phone.trim())) return "Phone number must be 10 digits.";
    if (!assignForm.monthlyRent || Number(assignForm.monthlyRent) <= 0) return "Monthly rent is required.";
    if (!assignForm.depositAmount && assignForm.depositAmount !== "0") return "Deposit amount is required.";
    if (!assignForm.joinDate) return "Join date is required.";
    if (!selectedRoom || !selectedBed) return "Please select a room and bed.";
    return "";
  };

  const submitAssign = async () => {
    const validationError = validateAssignForm();
    if (validationError) {
      setAssignError(validationError);
      toast.error(validationError);
      return;
    }

    setAssignLoading(true);
    try {
      const form = new FormData();
      form.append("name", assignForm.name.trim());
      form.append("phone", assignForm.phone.trim());
      form.append("roomId", selectedRoom._id);
      form.append("bedId", selectedBed._id);
      form.append("monthlyRent", assignForm.monthlyRent);
      form.append("depositAmount", assignForm.depositAmount);
      form.append("joinDate", assignForm.joinDate);

      await api.post("/api/residents/create", form);

      triggerOccupancyRefresh("resident-assigned");
      toast.success("Resident assigned successfully.");
      closeAssignModal();
      await refreshOccupancyUI();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to assign resident.";
      setAssignError(message);
      toast.error(message);
    } finally {
      setAssignLoading(false);
    }
  };

  const openResidentModal = async (residentId) => {
    if (!residentId) return;
    setResidentLoading(true);
    setResidentModalOpen(true);
    setSelectedResidentId(residentId);
    setResidentDetails(null);
    setResidentPayments([]);

    try {
      const [residentRes, paymentsRes] = await Promise.all([
        api.get(`/api/residents/single/${residentId}`),
        api.get(`/api/payments/resident/${residentId}`),
      ]);
      setResidentDetails(residentRes.data?.resident ?? null);
      setResidentPayments(paymentsRes.data?.payments || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load resident details.");
      setResidentModalOpen(false);
    } finally {
      setResidentLoading(false);
    }
  };

  const closeResidentModal = () => {
    if (residentLoading) return;
    setResidentModalOpen(false);
    setSelectedResidentId(null);
    setResidentDetails(null);
    setResidentPayments([]);
  };

  const openCheckoutModal = (room, bed) => {
    const residentId = bed?.residentId || residentMapByBedId[bed?._id]?._id || bed?.resident?._id;
    if (!residentId) {
      toast.error("Resident information is missing for this bed.");
      return;
    }
    setSelectedRoom(room);
    setSelectedBed(bed);
    setSelectedResidentId(residentId);
    setCheckoutModalOpen(true);
  };

  const closeCheckoutModal = () => {
    if (checkoutLoading) return;
    setCheckoutModalOpen(false);
    setSelectedResidentId(null);
    setSelectedBed(null);
    setSelectedRoom(null);
  };

  const submitCheckout = async () => {
    if (!selectedResidentId) {
      toast.error("Checkout resident not selected.");
      return;
    }

    setCheckoutLoading(true);
    try {
      await api.put(`/api/residents/checkout/${selectedResidentId}`);
      toast.success("Resident checked out successfully.");
      triggerOccupancyRefresh("resident-checkout");
      closeCheckoutModal();
      await refreshOccupancyUI();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to checkout resident.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      roomNumber: room.roomNumber || "",
      totalBeds: room.totalBeds ? String(room.totalBeds) : "",
      floor: room.floor || "",
      roomType: room.roomType || "",
      rentPerBed: room.rentPerBed ? String(room.rentPerBed) : "",
    });
    setRoomFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetRoomForm = () => {
    setEditingRoom(null);
    setRoomForm({ roomNumber: "", totalBeds: "", floor: "", roomType: "", rentPerBed: "" });
  };

  const submitRoom = async () => {
    if (roomSaving) return;

    const roomNumberRaw = roomForm.roomNumber;
    const roomNumber = String(roomNumberRaw ?? "").trim();

    if (!roomNumber) {
      toast.error("Room number is required.");
      return;
    }

    const rentPerBedNum = Number(roomForm.rentPerBed);
    if (!Number.isFinite(rentPerBedNum) || rentPerBedNum < 0) {
      toast.error("Rent per bed must be >= 0.");
      return;
    }

    if (!editingRoom) {
      const totalBedsNum = Number(roomForm.totalBeds);
      if (!Number.isFinite(totalBedsNum) || totalBedsNum <= 0) {
        toast.error("Total beds must be greater than 0.");
        return;
      }
    }

    setRoomSaving(true);
    try {
      if (editingRoom) {
        await api.put(`/api/rooms/edit-room/${editingRoom._id}`, {
          roomNumber: roomNumber,
          floor: String(roomForm.floor ?? "").trim(),
          roomType: String(roomForm.roomType ?? "").trim(),
          rentPerBed: rentPerBedNum,
        });
        toast.success("Room updated successfully.");
        triggerOccupancyRefresh("room-updated");
      } else {
        const totalBedsNum = Number(roomForm.totalBeds);
        await api.post("/api/rooms/create-room", {
          roomNumber: roomNumber,
          totalBeds: totalBedsNum,
          floor: String(roomForm.floor ?? "").trim(),
          roomType: String(roomForm.roomType ?? "").trim(),
          rentPerBed: rentPerBedNum,
        });
        toast.success("Room created successfully.");
        triggerOccupancyRefresh("room-created");
      }

      resetRoomForm();
      setRoomFormOpen(false);
      await loadData();
    } catch (error) {
      const msg = error?.response?.data?.message || "Unable to save room.";
      if (String(msg).toLowerCase().includes("room number already exists")) {
        toast.error("Room number already exists.");
      } else {
        toast.error(msg);
      }
      // preserve modal values by NOT resetting
    } finally {
      setRoomSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#081028", overflowX: "hidden", paddingBottom: 160 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
        <header style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h1 style={{ color: "#f8fafc", fontSize: 32, margin: 0 }}>Room & Bed Control</h1>
            <p style={{ color: "rgba(241,245,249,0.72)", maxWidth: 720, lineHeight: 1.7, margin: 0 }}>
              Manage hostel occupancy with real room cards, bed assignment, resident profiles and checkout workflows.
            </p>
          </div>

          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Search size={18} style={{ position: "absolute", left: 16, top: 14, color: "rgba(241,245,249,0.4)" }} />
              <input
                type="search"
                value={searchRoomNumber}
                onChange={(event) => setSearchRoomNumber(event.target.value)}
                placeholder="Search room number"
                style={{
                  width: "100%",
                  borderRadius: 18,
                  padding: "14px 16px 14px 44px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f8fafc",
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setRoomFormOpen((open) => !open);
                if (!roomFormOpen) resetRoomForm();
              }}
              style={{
                borderRadius: 16,
                border: "1px solid rgba(34,197,94,0.35)",
                background: "rgba(34,197,94,0.14)",
                color: "#f8fafc",
                padding: "14px 20px",
                minWidth: 160,
                cursor: "pointer",
              }}
            >
              <Plus size={16} style={{ marginRight: 8 }} />
              {roomFormOpen ? "Hide form" : "Add room"}
            </button>
          </div>
        </header>

        {roomFormOpen && (
          <section
            style={{
              marginBottom: 32,
              borderRadius: 28,
              padding: 24,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
              <div>
                <p style={{ margin: 0, color: "rgba(241,245,249,0.6)", fontSize: 13 }}>Room configuration</p>
                <h2 style={{ margin: "10px 0 0", color: "#f8fafc", fontSize: 22 }}>
                  {editingRoom ? "Edit room details" : "Create a new room"}
                </h2>
              </div>
            </div>

            <div style={{ display: "grid", gap: 18 }}>
              <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <label style={{ display: "grid", gap: 8, color: "#f8fafc", fontSize: 13 }}>
                  Room number
                  <input
                    value={roomForm.roomNumber}
                    onChange={(event) => setRoomForm((prev) => ({ ...prev, roomNumber: event.target.value }))}
                    placeholder="101"
                    style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: "12px 14px", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
                  />
                </label>
                <label style={{ display: "grid", gap: 8, color: "#f8fafc", fontSize: 13 }}>
                  Rent per bed
                  <input
                    type="number"
                    value={roomForm.rentPerBed}
                    onChange={(event) => setRoomForm((prev) => ({ ...prev, rentPerBed: event.target.value }))}
                    placeholder="5000"
                    style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: "12px 14px", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
                  />
                </label>
              </div>
              {!editingRoom && (
                <label style={{ display: "grid", gap: 8, color: "#f8fafc", fontSize: 13 }}>
                  Total beds
                  <input
                    type="number"
                    value={roomForm.totalBeds}
                    onChange={(event) => setRoomForm((prev) => ({ ...prev, totalBeds: event.target.value }))}
                    placeholder="2"
                    style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: "12px 14px", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
                  />
                </label>
              )}
              <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <label style={{ display: "grid", gap: 8, color: "#f8fafc", fontSize: 13 }}>
                  Floor
                  <input
                    value={roomForm.floor}
                    onChange={(event) => setRoomForm((prev) => ({ ...prev, floor: event.target.value }))}
                    placeholder="First"
                    style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: "12px 14px", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
                  />
                </label>
                <label style={{ display: "grid", gap: 8, color: "#f8fafc", fontSize: 13 }}>
                  Type
                  <input
                    value={roomForm.roomType}
                    onChange={(event) => setRoomForm((prev) => ({ ...prev, roomType: event.target.value }))}
                    placeholder="AC / Non-AC"
                    style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: "12px 14px", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
                  />
                </label>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    resetRoomForm();
                    setRoomFormOpen(false);
                  }}
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "transparent",
                    color: "#f8fafc",
                    padding: "12px 18px",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={submitRoom}
                  disabled={roomSaving}
                  style={{
                    borderRadius: 18,
                    border: "none",
                    background: "#22c55e",
                    color: "#081028",
                    padding: "12px 18px",
                    cursor: roomSaving ? "not-allowed" : "pointer",
                    opacity: roomSaving ? 0.7 : 1,
                  }}
                >
                  {roomSaving ? "Creating..." : editingRoom ? "Save room" : "Create room"}
                </button>
              </div>
            </div>
          </section>
        )}

        <section style={{ display: "grid", gap: 16 }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 220,
                borderRadius: 24,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Loader2 size={30} className="spin" color="#22c55e" />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                minHeight: 220,
                borderRadius: 24,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <BedDouble size={42} color="rgba(241,245,249,0.45)" />
              <p style={{ color: "rgba(241,245,249,0.7)", margin: 0 }}>No rooms match the current filters.</p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const { totalBeds, occupiedBeds, vacantBeds, pct, beds } = getRoomStats(room);
              const acLike = String(room.roomType || "").toLowerCase().includes("ac");

              return (
                <div
                  key={room._id}
                  style={{
                    borderRadius: 28,
                    background: "rgba(11,23,57,0.9)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: 24,
                    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          <h2 style={{ color: "#f8fafc", margin: 0, fontSize: 24 }}>Room {room.roomNumber}</h2>
                          <span
                            style={{
                              borderRadius: 16,
                              padding: "6px 12px",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#ffffff",
                              background: acLike ? "rgba(34,197,94,0.16)" : "rgba(255,255,255,0.06)",
                              border: acLike ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            {acLike ? "AC" : room.roomType || "Room"}
                          </span>
                        </div>
                        <p style={{ margin: "12px 0 0", color: "rgba(241,245,249,0.72)", fontSize: 14 }}>
                          Floor {room.floor || "-"} · {formatMoney(room.rentPerBed)} per bed
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleEditRoom(room)}
                          style={{
                            borderRadius: 16,
                            border: "1px solid rgba(34,197,94,0.35)",
                            background: "rgba(34,197,94,0.1)",
                            color: "#f8fafc",
                            padding: "12px 16px",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await api.delete(`/api/rooms/delete-room/${room._id}`);
                              triggerOccupancyRefresh("room-deleted");
                              toast.success("Room deleted successfully.");
                              await loadData();
                            } catch (error) {
                              toast.error(error?.response?.data?.message || "Unable to delete room.");
                            }
                          }}
                          style={{
                            borderRadius: 16,
                            border: "1px solid rgba(239,68,68,0.35)",
                            background: "rgba(239,68,68,0.1)",
                            color: "#f8fafc",
                            padding: "12px 16px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 14 }}>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <p style={{ margin: 0, color: "rgba(241,245,249,0.6)", fontSize: 12 }}>Total beds</p>
                          <p style={{ margin: "8px 0 0", color: "#ffffff", fontWeight: 700, fontSize: 18 }}>{totalBeds}</p>
                        </div>
                        <div style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <p style={{ margin: 0, color: "rgba(241,245,249,0.6)", fontSize: 12 }}>Occupied</p>
                          <p style={{ margin: "8px 0 0", color: "#ffffff", fontWeight: 700, fontSize: 18 }}>{occupiedBeds}</p>
                        </div>
                        <div style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <p style={{ margin: 0, color: "rgba(241,245,249,0.6)", fontSize: 12 }}>Vacant</p>
                          <p style={{ margin: "8px 0 0", color: "#ffffff", fontWeight: 700, fontSize: 18 }}>{vacantBeds}</p>
                        </div>
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "rgba(241,245,249,0.8)", fontSize: 13 }}>
                          <span>Occupancy</span>
                          <span>{pct}%</span>
                        </div>
                        <div style={{ width: "100%", height: 12, borderRadius: 999, background: "rgba(255,255,255,0.08)" }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              borderRadius: 999,
                              background: "linear-gradient(90deg, rgba(34,197,94,0.95), rgba(20,241,217,0.65))",
                              boxShadow: "0 0 18px rgba(34,197,94,0.25)",
                              transition: "width 300ms ease",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 14,
                      }}
                    >
                      {beds.map((bed, idx) => {
                        const status = String(bed?.status || "vacant").toLowerCase();
                        const isVacant = status !== "occupied";

                        const occ = occupancyStyleForBed(bed);
                        const resident = residentMapById[bed?.residentId] || residentMapByBedId[bed?._id] || null;
                        const residentName = resident?.name || "Resident";
                        const residentPhone = resident?.phone || "";
                        const residentPhoto = resident?.photo ? `${import.meta.env.VITE_API_URL}/uploads/${resident.photo}` : null;
                        const initials = getInitials(residentName);
                        const payment = paymentSummaryByResidentId[resident?._id];
                        const badge = getPaymentBadge(payment?.status);

                        // const isVacant = isBedVacant(bed);


                        return (
                          <div
                            key={bed?._id || `${room._id}-${idx}`}
                            style={{
                              borderRadius: 22,
                              padding: 18,
                              minHeight: 200,
                              display: "flex",
                              flexDirection: "column",
                              gap: 12,
                              border: `1px solid ${occ.border}`,
                              background: isVacant ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.10)",
                            }}
                          >

                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <BedDouble size={18} color={isVacant ? "#ef4444" : "#22c55e"} />
                                  <h3 style={{ margin: 0, fontSize: 15, color: "#f8fafc" }}>Bed {bed?.bedNumber || idx + 1}</h3>
                                </div>
                                <p
                                  style={{
                                    margin: "8px 0 0",
                                    fontSize: 13,
                                    fontWeight: 800,
                                    color: isVacant ? "rgba(254,202,202,0.95)" : "rgba(187,247,208,0.95)",
                                  }}
                                >
                                  {occ.label}
                                </p>
                              </div>
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 16,
                                  display: "grid",
                                  placeItems: "center",
                                background: isVacant ? "rgba(239,68,68,0.14)" : "rgba(34,197,94,0.14)",
                                  color: "#f8fafc",
                                }}
                              >
                                {residentPhoto ? (
                                  <img
                                    src={residentPhoto}
                                    alt={residentName}
                                    style={{ width: 40, height: 40, borderRadius: 14, objectFit: "cover" }}
                                    onError={(event) => {
                                      event.currentTarget.onerror = null;
                                      event.currentTarget.src = "";
                                    }}
                                  />
                                ) : (
                                  <span style={{ fontWeight: 800 }}>{initials}</span>
                                )}
                              </div>
                            </div>

                            {!isVacant && payment && (
                              <span
                                style={{
                                  alignSelf: "flex-start",
                                  borderRadius: 999,
                                  padding: "6px 10px",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#f8fafc",
                                  background: badge.color,
                                  border: `1px solid ${badge.border}`,
                                }}
                              >
                                {badge.label}
                              </span>
                            )}

                            {!isVacant && residentPhone && (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(241,245,249,0.75)", fontSize: 13 }}>
                                <Phone size={14} />
                                <span>{residentPhone}</span>
                              </div>
                            )}

                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: "auto" }}>
                              {isVacant ? (
                                <button
                                  type="button"
                                  onClick={() => openAssignModal(room, bed)}
                                  style={{
                                    flex: 1,
                                    borderRadius: 16,
                                    border: "1px solid rgba(239,68,68,0.35)",
                                    background: "rgba(239,68,68,0.12)",
                                    color: "#f8fafc",
                                    padding: "12px 14px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Assign
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openResidentModal(resident?._id || bed?.residentId)}
                                    style={{
                                      flex: 1,
                                      borderRadius: 16,
                                      border: "1px solid rgba(255,255,255,0.12)",
                                      background: "rgba(255,255,255,0.06)",
                                      color: "#f8fafc",
                                      padding: "12px 14px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openCheckoutModal(room, bed)}
                                    style={{
                                      minWidth: 110,
                                      borderRadius: 16,
                                      border: "1px solid rgba(239,68,68,0.28)",
                                      background: "rgba(239,68,68,0.12)",
                                      color: "#f8fafc",
                                      padding: "12px 14px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Checkout
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {assignModalOpen && selectedRoom && selectedBed && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1200,
              background: "rgba(0,0,0,0.78)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                width: "min(760px,100%)",
                maxHeight: "calc(100vh - 40px)",
                borderRadius: 28,
                background: "rgba(11,23,57,0.98)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: 28,
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 22 }}>
                <div>
                  <p style={{ margin: 0, color: "rgba(241,245,249,0.6)", fontSize: 13 }}>Assign resident to</p>
                  <h2 style={{ margin: "8px 0 0", color: "#f8fafc", fontSize: 24 }}>
                    Room {selectedRoom.roomNumber} · Bed {selectedBed.bedNumber}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeAssignModal}
                  style={{ border: "none", background: "transparent", color: "#f8fafc", cursor: "pointer" }}
                >
                  <X size={22} />
                </button>
              </div>

              <div style={{ display: "grid", gap: 18 }}>
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <CheckCircle2 color="#22c55e" />
                    <h3 style={{ margin: 0, color: "#f8fafc", fontSize: 18 }}>Resident information</h3>
                  </div>
                  {assignError ? (
                    <div style={{ color: "#fee2e2", background: "rgba(239,68,68,0.12)", padding: 12, borderRadius: 16, border: "1px solid rgba(239,68,68,0.2)" }}>
                      {assignError}
                    </div>
                  ) : null}
                  <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <label style={{ display: "grid", gap: 6, color: "#f8fafc", fontSize: 13 }}>
                        Full name
                        <input
                          type="text"
                          value={assignForm.name}
                          onChange={(event) => setAssignForm((prev) => ({ ...prev, name: event.target.value }))}
                          placeholder="Enter resident name"
                          style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: "12px 14px", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
                        />
                      </label>
                      <label style={{ display: "grid", gap: 6, color: "#f8fafc", fontSize: 13 }}>
                        Phone
                        <input
                          type="tel"
                          value={assignForm.phone}
                          onChange={(event) => setAssignForm((prev) => ({ ...prev, phone: event.target.value }))}
                          placeholder="10 digit phone"
                          style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: "12px 14px", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
                        />
                      </label>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <label style={{ display: "grid", gap: 6, color: "#f8fafc", fontSize: 13 }}>
                        Monthly rent
                        <input
                          type="number"
                          value={assignForm.monthlyRent}
                          onChange={(event) => setAssignForm((prev) => ({ ...prev, monthlyRent: event.target.value }))}
                          placeholder="Monthly rent"
                          style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: "12px 14px", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
                        />
                      </label>
                      <label style={{ display: "grid", gap: 6, color: "#f8fafc", fontSize: 13 }}>
                        Deposit amount
                        <input
                          type="number"
                          value={assignForm.depositAmount}
                          onChange={(event) => setAssignForm((prev) => ({ ...prev, depositAmount: event.target.value }))}
                          placeholder="Deposit amount"
                          style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: "12px 14px", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
                        />
                      </label>
                    </div>
                    <label style={{ display: "grid", gap: 6, color: "#f8fafc", fontSize: 13 }}>
                      Join date
                      <input
                        type="date"
                        value={assignForm.joinDate}
                        onChange={(event) => setAssignForm((prev) => ({ ...prev, joinDate: event.target.value }))}
                        style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: "12px 14px", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
                      />
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={closeAssignModal}
                    style={{
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "transparent",
                      color: "#f8fafc",
                      padding: "12px 18px",
                      minWidth: 120,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitAssign}
                    disabled={assignLoading}
                    style={{
                      borderRadius: 18,
                      border: "none",
                      background: "#22c55e",
                      color: "#081028",
                      padding: "12px 18px",
                      minWidth: 150,
                      cursor: assignLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {assignLoading ? "Assigning..." : "Assign Resident"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {residentModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1200,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                width: "min(860px,100%)",
                maxHeight: "calc(100vh - 40px)",
                borderRadius: 28,
                background: "rgba(11,23,57,0.98)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: 28,
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 24 }}>
                <div>
                  <p style={{ margin: 0, color: "rgba(241,245,249,0.6)", fontSize: 13 }}>Resident profile</p>
                  <h2 style={{ margin: "8px 0 0", color: "#f8fafc", fontSize: 24 }}>
                    {residentDetails?.name || "Resident details"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeResidentModal}
                  style={{ border: "none", background: "transparent", color: "#f8fafc", cursor: "pointer" }}
                >
                  <X size={22} />
                </button>
              </div>

              {residentLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 240 }}>
                  <Loader2 size={32} className="spin" color="#22c55e" />
                </div>
              ) : (
                <div style={{ display: "grid", gap: 22 }}>
                  <section
                    style={{
                      display: "grid",
                      gap: 12,
                      borderRadius: 24,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      padding: 22,
                    }}
                  >
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <div
                        style={{
                          width: 74,
                          height: 74,
                          borderRadius: 22,
                          background: "rgba(255,255,255,0.08)",
                          display: "grid",
                          placeItems: "center",
                          overflow: "hidden",
                        }}
                      >
                        {residentDetails?.photo ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}/uploads/${residentDetails.photo}`}
                            alt={residentDetails.name || "Resident photo"}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: 20 }}>{getInitials(residentDetails?.name)}</span>
                        )}
                      </div>
                      <div>
                        <p style={{ margin: 0, color: "rgba(241,245,249,0.7)", fontSize: 13 }}>Personal details</p>
                        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                          <span style={{ color: "#ffffff", fontWeight: 700 }}>{residentDetails?.name || "-"}</span>
                          <span style={{ color: "rgba(241,245,249,0.72)", fontSize: 14 }}>Phone: {residentDetails?.phone || "-"}</span>
                          <span style={{ color: "rgba(241,245,249,0.72)", fontSize: 14 }}>Email: {residentDetails?.email || "Not provided"}</span>
                          <span style={{ color: "rgba(241,245,249,0.72)", fontSize: 14 }}>Joined on {formatDate(residentDetails?.joinDate)}</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section
                    style={{
                      display: "grid",
                      gap: 12,
                      borderRadius: 24,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      padding: 22,
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Info size={18} color="#22c55e" />
                      <h3 style={{ margin: 0, color: "#f8fafc", fontSize: 18 }}>Room & bed details</h3>
                    </div>
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ color: "rgba(241,245,249,0.72)", fontSize: 14 }}>Room number: {roomNumberById[residentDetails?.roomId] || residentDetails?.roomId || "-"}</div>
                      <div style={{ color: "rgba(241,245,249,0.72)", fontSize: 14 }}>Bed number: {bedNumberById[residentDetails?.bedId] || residentDetails?.bedId || "-"}</div>
                      <div style={{ color: "rgba(241,245,249,0.72)", fontSize: 14 }}>Monthly rent: {formatMoney(residentDetails?.monthlyRent)}</div>
                      <div style={{ color: "rgba(241,245,249,0.72)", fontSize: 14 }}>Occupancy status: {residentDetails?.status || "active"}</div>
                    </div>
                  </section>

                  <section
                    style={{
                      display: "grid",
                      gap: 12,
                      borderRadius: 24,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      padding: 22,
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <CreditCard size={18} color="#22c55e" />
                      <h3 style={{ margin: 0, color: "#f8fafc", fontSize: 18 }}>Payment summary</h3>
                    </div>
                    {residentPayments.length === 0 ? (
                      <p style={{ margin: 0, color: "rgba(241,245,249,0.72)" }}>No payments recorded yet.</p>
                    ) : (
                      (() => {
                        const latest = [...residentPayments].sort((a, b) => new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime())[0];
                        const totalPaid = latest.entries?.reduce((sum, entry) => sum + Number(entry.amount || 0), 0) || 0;
                        const balance = latest.balance ?? Math.max(0, (latest.totalRent || 0) - totalPaid);
                        const nextDue = getDueDateLabel(latest, residentDetails?.joinDate);
                        const daysFromDue = getDaysFromDue(latest, residentDetails?.joinDate);
                        const dueText = daysFromDue === null ? "Not available" : daysFromDue >= 0 ? `${daysFromDue} days remaining` : `${Math.abs(daysFromDue)} days overdue`;
                        return (
                          <div style={{ display: "grid", gap: 12 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              <div style={{ borderRadius: 18, padding: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <p style={{ margin: 0, color: "rgba(241,245,249,0.7)", fontSize: 12 }}>Payment status</p>
                                <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{latest.status || "pending"}</p>
                              </div>
                              <div style={{ borderRadius: 18, padding: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <p style={{ margin: 0, color: "rgba(241,245,249,0.7)", fontSize: 12 }}>Paid</p>
                                <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{formatMoney(totalPaid)}</p>
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              <div style={{ borderRadius: 18, padding: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <p style={{ margin: 0, color: "rgba(241,245,249,0.7)", fontSize: 12 }}>Pending balance</p>
                                <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{formatMoney(balance)}</p>
                              </div>
                              <div style={{ borderRadius: 18, padding: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <p style={{ margin: 0, color: "rgba(241,245,249,0.7)", fontSize: 12 }}>Next due</p>
                                <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{nextDue}</p>
                              </div>
                            </div>
                            <p style={{ margin: 0, color: "rgba(241,245,249,0.72)", fontSize: 13 }}>{dueText}</p>
                          </div>
                        );
                      })()
                    )}
                  </section>

                  <section
                    style={{
                      display: "grid",
                      gap: 12,
                      borderRadius: 24,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      padding: 22,
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Calendar size={18} color="#22c55e" />
                      <h3 style={{ margin: 0, color: "#f8fafc", fontSize: 18 }}>Agreement summary</h3>
                    </div>
                    <div style={{ display: "grid", gap: 10, color: "rgba(241,245,249,0.72)", fontSize: 14 }}>
                      <div>Rules version: {residentDetails?.rulesVersionNumber || "Not signed"}</div>
                      <div>Signed at: {residentDetails?.signedAt ? formatDate(residentDetails.signedAt) : "Not signed"}</div>
                      <div>Signature recorded: {residentDetails?.signatureImage ? "Yes" : "No"}</div>
                    </div>
                  </section>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={closeResidentModal}
                      style={{
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "transparent",
                        color: "#f8fafc",
                        padding: "12px 18px",
                        cursor: "pointer",
                      }}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closeResidentModal();
                        setCheckoutModalOpen(true);
                      }}
                      style={{
                        borderRadius: 18,
                        border: "none",
                        background: "#ef4444",
                        color: "#f8fafc",
                        padding: "12px 18px",
                        cursor: "pointer",
                      }}
                    >
                      Checkout resident
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {checkoutModalOpen && selectedResidentId && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1200,
              background: "rgba(0,0,0,0.86)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                width: "min(560px,100%)",
                borderRadius: 28,
                background: "rgba(11,23,57,0.98)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: 28,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 24 }}>
                <div>
                  <p style={{ margin: 0, color: "rgba(241,245,249,0.6)", fontSize: 13 }}>Confirm checkout</p>
                  <h2 style={{ margin: "8px 0 0", color: "#f8fafc", fontSize: 24 }}>Finalize resident checkout</h2>
                </div>
                <button
                  type="button"
                  onClick={closeCheckoutModal}
                  style={{ border: "none", background: "transparent", color: "#f8fafc", cursor: "pointer" }}
                >
                  <X size={22} />
                </button>
              </div>
              <div style={{ display: "grid", gap: 20 }}>
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(241,245,249,0.9)" }}>
                    <AlertTriangle size={18} color="#f59e0b" />
                    <span style={{ color: "rgba(241,245,249,0.9)", fontSize: 15 }}>This bed will become vacant after checkout.</span>
                  </div>
                  <div style={{ borderRadius: 20, background: "rgba(255,255,255,0.04)", padding: 18, border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ margin: 0, color: "rgba(241,245,249,0.75)", fontSize: 14 }}>
                      Resident: <strong style={{ color: "#f8fafc" }}>{residentDetails?.name || "Resident"}</strong>
                    </p>
                    <p style={{ margin: "8px 0 0", color: "rgba(241,245,249,0.75)", fontSize: 14 }}>
                      Room: <strong style={{ color: "#f8fafc" }}>{selectedRoom?.roomNumber || "-"}</strong> · Bed: <strong style={{ color: "#f8fafc" }}>{selectedBed?.bedNumber || "-"}</strong>
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={closeCheckoutModal}
                    style={{
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "transparent",
                      color: "#f8fafc",
                      padding: "12px 18px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitCheckout}
                    disabled={checkoutLoading}
                    style={{
                      borderRadius: 18,
                      border: "none",
                      background: "#ef4444",
                      color: "#f8fafc",
                      padding: "12px 18px",
                      cursor: checkoutLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {checkoutLoading ? "Checking out..." : "Confirm Checkout"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default Rooms;
