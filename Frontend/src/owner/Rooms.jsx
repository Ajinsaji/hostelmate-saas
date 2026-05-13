import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, Trash2, Users, Edit2, Search, BedDouble, User, Phone, Shield, ArrowLeftRight } from "lucide-react";
import toast from "react-hot-toast";
import BottomNav from "../components/BottomNav";

function Rooms() {
  const token = localStorage.getItem("token");

  const [rooms, setRooms] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: "",
    totalBeds: "",
    floor: "",
    roomType: "",
    rentPerBed: "",
  });
  const [editingRoom, setEditingRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/rooms/get-rooms`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load rooms");
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const createRoom = async () => {
    try {
      if (editingRoom) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/rooms/edit-room/${editingRoom._id}`,
          { ...formData },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Room updated successfully!");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/rooms/create-room`,
          { ...formData },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Room created successfully!");
      }

      setFormData({
        roomNumber: "",
        totalBeds: "",
        floor: "",
        roomType: "",
        rentPerBed: "",
      });
      setShowAddForm(false);
      setEditingRoom(null);
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving room");
      console.log(error);
    }
  };

  const handleEdit = (room) => {
    setFormData({
      roomNumber: room.roomNumber,
      totalBeds: room.totalBeds,
      floor: room.floor || "",
      roomType: room.roomType || "",
      rentPerBed: room.rentPerBed || "",
    });
    setEditingRoom(room);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRoom = async (roomId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/rooms/delete-room/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Room deleted successfully!");
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting room");
      console.log(error);
    }
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter(
      (r) =>
        r.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.roomType?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rooms, searchQuery]);

  const bedStatus = (bed) => {
    const status = bed?.status;
    if (!status) return "vacant";
    const s = String(status).toLowerCase();
    return s.includes("vacant") ? "vacant" : "occupied";
  };

  const getStats = (room) => {
    const beds = room?.beds || [];
    const totalBeds = Number(room.totalBeds ?? beds.length ?? 0) || 0;
    const occupiedBeds = Number(room.occupiedBeds ?? beds.filter((b) => bedStatus(b) === "occupied").length ?? 0) || 0;
    const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
    const pct = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    return { totalBeds, occupiedBeds, vacantBeds, pct, beds };
  };

  const initialsFromName = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("");
  };

const handleAssignBed = () => toast("Assign bed action is not wired on this build.");
  const handleViewResident = (resident) => {
    toast(`View resident: ${resident?.name || resident?._id || "N/A"}`);
  };
  const handleRemoveBed = () => toast("Remove bed action is not wired on this build.");

  return (
    <div className="pb-32" style={{ minHeight: "100vh", position: "relative", zIndex: 100, overflowX: "hidden" }}>
      <div className="gradient-header mb-6">
        <h1 className="text-h1 mb-2">Room Management</h1>
        <p style={{ opacity: 0.85 }}>Manage your hostel rooms & beds</p>

        {!showAddForm && (
          <div style={{ position: "absolute", bottom: "-20px", right: "20px", zIndex: 5 }}>
            <button
              className="btn-icon"
              style={{ width: 56, height: 56, background: "var(--accent)", borderColor: "rgba(34,197,94,0.35)" }}
              onClick={() => setShowAddForm(!showAddForm)}
              aria-label="Add room"
            >
              <Plus size={28} color="var(--primary-dark)" />
            </button>
          </div>
        )}
      </div>

      <div className="p-4" style={{ maxWidth: 480, margin: "0 auto" }}>
        {!showAddForm && (
          <div className="input-group mb-6">
            <div style={{ position: "relative" }}>
              <Search size={20} style={{ position: "absolute", left: 16, top: 16, color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search rooms..."
                className="input-field"
                style={{ paddingLeft: 48 }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {showAddForm && (
          <div
            className="card animate-slide-up mb-6"
            style={{
              position: "relative",
              zIndex: 1000,
              pointerEvents: "auto",
              borderRadius: 24,
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-h2">{editingRoom ? "Edit Room" : "Create New Room"}</h2>
              <button
                className="btn-icon"
                style={{ width: 32, height: 32 }}
                onClick={() => {
                  setShowAddForm(false);
                  setEditingRoom(null);
                }}
                aria-label="Close form"
              >
                <Trash2 size={16} style={{ opacity: 0 }} />
                <span style={{ display: "none" }} />
              </button>
            </div>

            <div className="input-group">
              <span className="input-label">Room Number / Name</span>
              <input
                name="roomNumber"
                placeholder="e.g. 101"
                className="input-field"
                style={{ pointerEvents: "auto" }}
                value={formData.roomNumber}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-4 mb-4">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Total Beds</span>
                <input
                  name="totalBeds"
                  type="number"
                  placeholder="e.g. 2"
                  className="input-field"
                  style={{ pointerEvents: "auto" }}
                  value={formData.totalBeds}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Rent/Bed (₹)</span>
                <input
                  name="rentPerBed"
                  type="number"
                  placeholder="e.g. 5000"
                  className="input-field"
                  style={{ pointerEvents: "auto" }}
                  value={formData.rentPerBed}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Floor</span>
                <input
                  name="floor"
                  placeholder="e.g. Ground"
                  className="input-field"
                  style={{ pointerEvents: "auto" }}
                  value={formData.floor}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Type</span>
                <input
                  name="roomType"
                  placeholder="e.g. AC / Non-AC"
                  className="input-field"
                  style={{ pointerEvents: "auto" }}
                  value={formData.roomType}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button className="btn-primary mt-4" onClick={createRoom}>
              {editingRoom ? "Save Room" : "Create Room"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredRooms.map((room) => {
            const { totalBeds, occupiedBeds, vacantBeds, pct, beds } = getStats(room);
            const sharingType = room.roomType || "";
            const acLike = sharingType.toLowerCase().includes("ac");

            return (
              <div
                key={room._id}
                className="glass-card animate-slide-up"
                style={{
                  borderRadius: 24,
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "rgba(11,23,57,0.55)",
                }}
              >
                <div className="flex justify-between items-start mb-4" style={{ gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <div className="text-h2" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        Room {room.roomNumber}
                      </div>
                      <span
                        className="badge"
                        style={{
                          background: acLike ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)",
                          borderColor: acLike ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.10)",
                          color: "#ffffff",
                          fontWeight: 900,
                        }}
                      >
                        {acLike ? "AC" : "Non-AC"}
                      </span>
                    </div>

                    <p className="text-small" style={{ marginTop: 8 }}>
                      {room.floor} Floor • ₹{room.rentPerBed}/mo per bed
                    </p>
                    <p className="text-small" style={{ marginTop: 4, opacity: 0.95 }}>
                      Sharing: {sharingType || "—"}
                    </p>
                    <p className="text-small" style={{ marginTop: 4, opacity: 0.9 }}>
                      {occupiedBeds}/{totalBeds} occupied
                    </p>
                  </div>

                  <div className="flex gap-2" style={{ flexShrink: 0 }}>
                    <button
                      onClick={() => handleEdit(room)}
                      className="btn-icon"
                      style={{ background: "rgba(37,211,102,0.10)", borderColor: "rgba(37,211,102,0.25)" }}
                      aria-label="Edit room"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteRoom(room._id)}
                      className="btn-icon"
                      style={{ background: "rgba(239,68,68,0.10)", borderColor: "rgba(239,68,68,0.25)" }}
                      aria-label="Delete room"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* progress */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Users size={16} />
                    <span style={{ fontWeight: 900, color: "#fff" }}>
                      Filled {occupiedBeds} • Vacant {vacantBeds}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 10,
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, rgba(34,197,94,0.95), rgba(20,241,217,0.55))",
                        boxShadow: "0 0 18px rgba(34,197,94,0.25)",
                        transition: "width 300ms ease",
                      }}
                    />
                  </div>
                </div>

                {/* beds */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))",
                    gap: 12,
                  }}
                >
                  {beds.map((bed, idx) => {
                    const status = bedStatus(bed);
                    const vacant = status === "vacant";
                    const resident = bed?.resident || bed?.occupant || null;
                    const residentName = resident?.name || bed?.residentName || "";
                    const residentPhone = resident?.phone || bed?.residentPhone || "";
                    const initials = initialsFromName(residentName);

                    return (
                      <div
                        key={bed?._id || bed?.bedNumber || idx}
                        style={{
                          borderRadius: 18,
                          padding: 12,
                          border: `1px solid ${vacant ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`,
                          background: vacant ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)",
                          minHeight: 150,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <BedDouble size={20} color={vacant ? "var(--status-success)" : "var(--status-error)"} />
                              <div style={{ fontWeight: 900, color: "#fff", fontSize: 13 }}>Bed {bed.bedNumber || idx + 1}</div>
                            </div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.86)", fontWeight: 800 }}>
                              {vacant ? "Available" : residentName || "Occupied"}
                            </div>
                          </div>

                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 16,
                              background: vacant ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)",
                              border: `1px solid ${vacant ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 900,
                              color: "#fff",
                              flexShrink: 0,
                            }}
                            aria-label="Resident initials"
                          >
                            {initials || "—"}
                          </div>
                        </div>

                        {!vacant && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {residentPhone && (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.9)" }}>
                                <Phone size={14} />
                                <span style={{ fontWeight: 700 }}>{residentPhone}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                          {vacant ? (
                            <button
                              onClick={handleAssignBed}
                              className="btn-secondary"
                              style={{
                                padding: "10px 12px",
                                borderRadius: 14,
                                fontSize: 12,
                                background: "rgba(34,197,94,0.12)",
                                border: "1px solid rgba(34,197,94,0.25)",
                                color: "#fff",
                                flex: 1,
                              }}
                            >
                              Assign
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={handleViewResident}
                                className="btn-secondary"
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: 14,
                                  fontSize: 12,
                                  background: "rgba(239,68,68,0.12)",
                                  border: "1px solid rgba(239,68,68,0.25)",
                                  color: "#fff",
                                  flex: 1,
                                }}
                              >
                                View
                              </button>
                              <button
                                onClick={handleRemoveBed}
                                className="btn-secondary"
                                style={{
                                  padding: "10px 10px",
                                  borderRadius: 14,
                                  fontSize: 12,
                                  background: "rgba(239,68,68,0.08)",
                                  border: "1px solid rgba(239,68,68,0.18)",
                                  color: "#fff",
                                  flex: 0.6,
                                }}
                                aria-label="Remove bed"
                              >
                                <SwapHoriz size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredRooms.length === 0 && !showAddForm && (
            <div className="text-center pt-10 pb-10">
              <BedDouble size={48} color="var(--text-muted)" style={{ opacity: 0.3 }} />
              <p className="text-body mt-4">No rooms found.</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export default Rooms;

