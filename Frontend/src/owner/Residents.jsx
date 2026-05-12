import { useEffect, useState } from "react";
import axios from "axios";
import { UserPlus, Users, Phone, MapPin, Calendar, BedDouble, FileText, Trash2, Edit2, Search, MessageCircle, PhoneCall, Upload } from "lucide-react";
import toast from "react-hot-toast";
import BottomNav from "../components/BottomNav";

function Residents() {
  const [residents, setResidents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    name: "", phone: "", address: "", parentsNumber: "", 
    roomId: "", bedId: "", paymentMode: "Cash", monthlyRent: "", depositAmount: "0", joinDate: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [idProofFile, setIdProofFile] = useState(null);

  const token = localStorage.getItem("token");

  const fetchResidents = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/residents/hostel`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResidents(response.data.residents || []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/rooms/get-rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchResidents();
    fetchRooms();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (photoFile) data.append("photo", photoFile);
      if (idProofFile) data.append("idProof", idProofFile);

      if (editingResident) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/residents/update/${editingResident._id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Resident updated successfully!");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/residents/create`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Resident added successfully!");
      }
      
      fetchResidents();
      fetchRooms(); // refresh bed availability
      setShowAddForm(false);
      setEditingResident(null);
      setFormData({
        name: "", phone: "", address: "", parentsNumber: "", 
        roomId: "", bedId: "", paymentMode: "Cash", monthlyRent: "", depositAmount: "0", joinDate: "",
      });
      setPhotoFile(null);
      setIdProofFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving resident");
      console.log(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/residents/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Resident deleted successfully!");
      fetchResidents();
    } catch (error) {
      toast.error("Error deleting resident");
      console.log(error);
    }
  };

  const handleEdit = (res) => {
    setFormData({
      name: res.name || "",
      phone: res.phone || "",
      address: res.address || "",
      parentsNumber: res.parentsNumber || "",
      roomId: res.roomId || "",
      bedId: res.bedId || "",
      paymentMode: "Cash",
      monthlyRent: res.monthlyRent || "",
      depositAmount: res.depositAmount || "0",
      joinDate: res.joinDate ? new Date(res.joinDate).toISOString().split('T')[0] : "",
    });
    setEditingResident(res);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredResidents = residents.filter(r => 
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phone?.includes(searchQuery)
  );

  const selectedRoom = rooms.find(r => r._id === formData.roomId);

  return (
    <div className="pb-24" style={{ minHeight: "100vh" }}>
      {/* HEADER */}
      <div className="gradient-header mb-6">
        <h1 className="text-h1 mb-2">Residents</h1>
        <p style={{ opacity: 0.8 }}>Manage hostel residents & details</p>
        
        <div style={{ position: "absolute", bottom: "-20px", right: "20px" }}>
          <button 
            className="btn-icon" 
            style={{ width: "56px", height: "56px", background: "var(--accent)" }}
            onClick={() => { setShowAddForm(!showAddForm); setEditingResident(null); }}
          >
            <UserPlus size={24} color="var(--primary-dark)" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Search */}
        {!showAddForm && (
          <div className="input-group mb-6">
            <div style={{ position: "relative" }}>
              <Search size={20} style={{ position: "absolute", left: "16px", top: "16px", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search residents by name or phone..."
                className="input-field"
                style={{ paddingLeft: "48px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ADD / EDIT RESIDENT FORM */}
        {showAddForm && (
          <div className="card animate-slide-up mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-h2">{editingResident ? "Edit Resident" : "Add New Resident"}</h2>
              <button className="btn-icon" style={{ width: 32, height: 32 }} onClick={() => setShowAddForm(false)}>
                <Trash2 size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <span className="input-label">Full Name</span>
                <input name="name" placeholder="e.g. John Doe" className="input-field" value={formData.name} onChange={handleChange} required />
              </div>
              
              <div className="flex gap-4 mb-4">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Phone</span>
                  <input name="phone" placeholder="Mobile Number" className="input-field" value={formData.phone} onChange={handleChange} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Parents Phone</span>
                  <input name="parentsNumber" placeholder="Emergency" className="input-field" value={formData.parentsNumber} onChange={handleChange} />
                </div>
              </div>
              
              <div className="flex gap-4 mb-4">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Room</span>
                  <select name="roomId" className="input-field" value={formData.roomId} onChange={handleChange} required>
                    <option value="">Select Room</option>
                    {rooms.map(r => (
                      <option key={r._id} value={r._id}>Room {r.roomNumber}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Bed</span>
                  <select name="bedId" className="input-field" value={formData.bedId} onChange={handleChange} required>
                    <option value="">Select Bed</option>
                    {selectedRoom?.beds?.map(b => (
                      (b.status === "vacant" || b._id === formData.bedId) && 
                      <option key={b._id} value={b._id}>Bed {b.bedNumber}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <span className="input-label">Address</span>
                <input name="address" placeholder="Home Address" className="input-field" value={formData.address} onChange={handleChange} />
              </div>
              
              <div className="flex gap-4 mb-4">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Monthly Rent (₹)</span>
                  <input name="monthlyRent" type="number" placeholder="Rent Amount" className="input-field" value={formData.monthlyRent} onChange={handleChange} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Deposit (₹)</span>
                  <input name="depositAmount" type="number" placeholder="Deposit Amount" className="input-field" value={formData.depositAmount} onChange={handleChange} />
                </div>
              </div>

              <div className="input-group mb-4">
                <span className="input-label">Join Date</span>
                <input type="date" name="joinDate" className="input-field" value={formData.joinDate} onChange={handleChange} required />
              </div>

              {/* File Uploads */}
              <div className="flex gap-4 mb-6">
                <label className="input-group hover:border-primary" style={{ flex: 1, padding: "16px", border: "2px dashed rgba(0,0,0,0.1)", borderRadius: "12px", textAlign: "center", cursor: "pointer" }}>
                  <Upload size={20} color="var(--primary)" style={{ margin: "0 auto 8px" }} />
                  <span className="text-small">{photoFile ? photoFile.name : "Upload Photo"}</span>
                  <input type="file" style={{ display: "none" }} onChange={(e) => setPhotoFile(e.target.files[0])} />
                </label>
                <label className="input-group hover:border-primary" style={{ flex: 1, padding: "16px", border: "2px dashed rgba(0,0,0,0.1)", borderRadius: "12px", textAlign: "center", cursor: "pointer" }}>
                  <Upload size={20} color="var(--primary)" style={{ margin: "0 auto 8px" }} />
                  <span className="text-small">{idProofFile ? idProofFile.name : "Upload ID Proof"}</span>
                  <input type="file" style={{ display: "none" }} onChange={(e) => setIdProofFile(e.target.files[0])} />
                </label>
              </div>

              <button type="submit" className="btn-primary">
                {editingResident ? "Update Resident" : "Save Resident"}
              </button>
            </form>
          </div>
        )}

        {/* RESIDENT LIST */}
        <div className="flex-col gap-4">
          {filteredResidents.map((item) => {
            const rRoom = rooms.find(r => r._id === item.roomId);
            const rBed = rRoom?.beds?.find(b => b._id === item.bedId);
            return (
            <div key={item._id} className="card animate-slide-up" style={{ padding: "16px" }}>
              <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
                <div className="flex items-center gap-4">
                  {item.photo ? (
                    <img 
                      src={`${import.meta.env.VITE_API_URL}/uploads/${item.photo}`} 
                      alt="avatar" 
                      style={{ width: 50, height: 50, borderRadius: 16, objectFit: "cover" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div 
                    id="avatar-fallback"
                    style={{ 
                      width: "50px", 
                      height: "50px", 
                      borderRadius: "16px", 
                      background: "rgba(37, 211, 102, 0.15)", 
                      display: item.photo ? "none" : "flex",
                      justifyContent: "center", 
                      alignItems: "center", 
                      color: "var(--primary)" 
                    }}
                  >
                    <span className="text-h2" style={{ color: "var(--primary)" }}>{item.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="text-h3" style={{ marginBottom: "2px" }}>{item.name}</h3>
                    <div className="flex items-center gap-2 text-small">
                      <Phone size={12} /> {item.phone}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => window.open(`https://wa.me/91${item.phone}`, "_blank")} className="btn-icon" style={{ background: "rgba(37, 211, 102, 0.1)", color: "#25D366", width: 32, height: 32 }}>
                    <MessageCircle size={16} />
                  </button>
                  <button onClick={() => window.open(`tel:${item.phone}`)} className="btn-icon" style={{ background: "rgba(52, 183, 241, 0.1)", color: "#34B7F1", width: 32, height: 32 }}>
                    <PhoneCall size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="flex items-center gap-2 text-small">
                  <BedDouble size={16} color="var(--primary)" />
                  Room {rRoom?.roomNumber || "N/A"} • Bed {rBed?.bedNumber || "N/A"}
                </div>
                <div className="flex items-center gap-2 text-small">
                  <FileText size={16} color="var(--primary)" />
                  Rent: ₹{item.monthlyRent}
                </div>
                <div className="flex items-center gap-2 text-small">
                  <Calendar size={16} color="var(--primary)" />
                  Joined: {new Date(item.joinDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-small">
                  <MapPin size={16} color="var(--primary)" />
                  {item.address || "N/A"}
                </div>
              </div>
              
              <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--border-color)" }}>
                <button className="btn-secondary" style={{ flex: 1, padding: "8px", fontSize: "14px" }} onClick={() => handleEdit(item)}>
                  <Edit2 size={16} /> Edit
                </button>
                <button className="btn-secondary" style={{ flex: 1, padding: "8px", fontSize: "14px", color: "var(--status-pending)", borderColor: "var(--status-pending)" }} onClick={() => handleDelete(item._id)}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
            );
          })}
          {filteredResidents.length === 0 && !showAddForm && (
            <div className="text-center pt-8 pb-8">
              <Users size={48} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: "16px", margin: "0 auto" }} />
              <p className="text-body mt-4">No residents found.</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default Residents;