import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Trash2, Users, Edit2, Search, BedDouble, User, Phone, CalendarDays, ArrowRight, SwapHoriz, UserRound, XCircle } from "lucide-react";
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
      
      setFormData({ roomNumber: "", totalBeds: "", floor: "", roomType: "", rentPerBed: "" });
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
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/rooms/delete-room/${roomId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Room deleted successfully!");
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting room");
      console.log(error);
    }
  };

  const filteredRooms = rooms.filter(r => 
    r.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.roomType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-32" style={{ minHeight: "100vh", position: "relative", zIndex: 100 }}>
      {/* Header */}
      <div className="gradient-header mb-6">
        <h1 className="text-h1 mb-2">Room Management</h1>
        <p style={{ opacity: 0.8 }}>Manage your hostel's rooms and beds</p>
        
        {!showAddForm && (
          <div
            style={{
              position: "absolute",
              bottom: "-20px",
              right: "20px",
              zIndex: 5,
            }}
          >
            <button 
              className="btn-icon" 
              style={{ width: "56px", height: "56px", background: "var(--accent)" }}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus size={28} color="var(--primary-dark)" />
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Search Bar */}
        {!showAddForm && (
          <div className="input-group mb-6">
            <div style={{ position: "relative" }}>
              <Search size={20} style={{ position: "absolute", left: "16px", top: "16px", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search rooms..."
                className="input-field"
                style={{ paddingLeft: "48px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Add/Edit Room Form */}
        {showAddForm && (
          <div
            className="card animate-slide-up mb-6"
            style={{
              position: "relative",
              zIndex: 1000,
              pointerEvents: "auto",
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-h2">{editingRoom ? "Edit Room" : "Create New Room"}</h2>
              <button className="btn-icon" style={{ width: 32, height: 32 }} onClick={() => { setShowAddForm(false); setEditingRoom(null); }}>
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="input-group">
              <span className="input-label">Room Number / Name</span>
              <input name="roomNumber" placeholder="e.g. 101" className="input-field" style={{ pointerEvents: "auto" }} value={formData.roomNumber} onChange={handleChange} />
            </div>

            <div className="flex gap-4 mb-4">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Total Beds</span>
                <input name="totalBeds" type="number" placeholder="e.g. 2" className="input-field" style={{ pointerEvents: "auto" }} value={formData.totalBeds} onChange={handleChange} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Rent/Bed (₹)</span>
                <input name="rentPerBed" type="number" placeholder="e.g. 5000" className="input-field" style={{ pointerEvents: "auto" }} value={formData.rentPerBed} onChange={handleChange} />
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Floor</span>
                <input name="floor" placeholder="e.g. Ground" className="input-field" style={{ pointerEvents: "auto" }} value={formData.floor} onChange={handleChange} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Type</span>
                <input name="roomType" placeholder="e.g. AC / Non-AC" className="input-field" style={{ pointerEvents: "auto" }} value={formData.roomType} onChange={handleChange} />
              </div>
            </div>

            <button className="btn-primary mt-4" onClick={createRoom}>
              Create Room
            </button>
          </div>
        )}

        {/* Room List & Bed Grid */}
        <div className="flex-col gap-4">
          {filteredRooms.map((room) => (
            <div key={room._id} className="card animate-slide-up">
              {/* Room Header */}
              <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
                <div>
                  <h2 className="text-h2" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    Room {room.roomNumber}
                    {room.roomType && <span className="badge" style={{ background: "var(--accent)", color: "var(--primary-dark)" }}>{room.roomType}</span>}
                  </h2>
                  <p className="text-small mt-2">{room.floor} Floor • Rent: ₹{room.rentPerBed}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(room)}
                    className="btn-icon"
                    style={{ background: "rgba(37, 211, 102, 0.1)", color: "var(--primary)", width: "36px", height: "36px" }}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => deleteRoom(room._id)}
                    className="btn-icon"
                    style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--status-pending)", width: "36px", height: "36px" }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Occupancy Info */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-small">
                  <Users size={16} /> 
                  <span style={{ fontWeight: 600 }}>{room.occupiedBeds} / {room.totalBeds} Occupied</span>
                </div>
              </div>

              {/* Bed Grid Visualizer */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", 
                gap: "12px" 
              }}>
                {room.beds?.map((bed, index) => (
                  <div 
                    key={bed._id || index}
                    style={{
                      padding: "16px 8px",
                      borderRadius: "16px",
                      background: bed.status === "vacant" ? "rgba(37, 211, 102, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      border: `1px solid ${bed.status === "vacant" ? "rgba(37, 211, 102, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      cursor: "pointer",
                      transition: "transform 0.2s"
                    }}

                  >
                    <BedDouble size={24} color={bed.status === "vacant" ? "var(--status-vacant)" : "var(--status-occupied)"} />
                    <span style={{ 
                      fontSize: "12px", 
                      fontWeight: 600, 
                      color: bed.status === "vacant" ? "var(--status-vacant)" : "var(--status-occupied)" 
                    }}>
                      Bed {bed.bedNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredRooms.length === 0 && !showAddForm && (
            <div className="text-center pt-8 pb-8">
              <BedDouble size={48} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: "16px", margin: "0 auto" }} />
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