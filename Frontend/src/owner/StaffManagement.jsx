import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MessageCircle, RefreshCcw, Trash2, Unlock, ShieldCheck } from "lucide-react";
import { api } from "../services/api";
import toast from "react-hot-toast";
import AddStaffModal from "./AddStaffModal";

function StaffManagement() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/staff/hostel");
      if (response.data.success) {
        setStaff(response.data.staff);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load staff members");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      const response = await api.post("/api/staff/create", data);
      if (response.data.success) {
        toast.success("Staff created and WhatsApp link generated");
        setIsModalOpen(false);
        fetchStaff();
        if (response.data.whatsappURL) {
          window.open(response.data.whatsappURL, "_blank");
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to add staff");
    }
  };

  const toggleStatus = async (id, isActive) => {
    try {
      const response = await api.put(`/api/staff/status/${id}`, { isActive: !isActive });
      if (response.data.success) {
        toast.success("Status updated");
        fetchStaff();
      }
    } catch (error) {
      toast.error("Unable to update status");
    }
  };

  const resetPassword = async (id) => {
    const newPassword = prompt("Enter new password for the staff member:");
    if (!newPassword) return;
    try {
      const response = await api.put(`/api/staff/reset-password/${id}`, { newPassword });
      if (response.data.success) {
        toast.success("Password reset. WhatsApp link opened.");
        if (response.data.whatsappURL) {
          window.open(response.data.whatsappURL, "_blank");
        }
      }
    } catch (error) {
      toast.error("Unable to reset password");
    }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm("Delete this staff member?")) return;
    try {
      const response = await api.delete(`/api/staff/delete/${id}`);
      if (response.data.success) {
        toast.success("Staff deleted");
        fetchStaff();
      }
    } catch (error) {
      toast.error("Unable to delete staff");
    }
  };

  return (
    <div className="pb-24" style={{ padding: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div>
          <h1 className="text-h1">Staff Management</h1>
          <p className="text-small" style={{ color: "rgba(255,255,255,0.75)" }}>
            Add and manage wardens and cooks for your hostel.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ minWidth: 160 }}>
          <Plus size={18} style={{ marginRight: 8 }} /> Add Staff
        </button>
      </div>

      <div style={{ background: "rgba(17, 24, 39, 0.9)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
        {loading ? (
          <p className="text-small" style={{ padding: 20 }}>Loading staff...</p>
        ) : staff.length === 0 ? (
          <div style={{ padding: 20 }}>
            <p className="text-small">No staff registered yet.</p>
          </div>
        ) : (
          staff.map((member) => (
            <div key={member._id} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 20, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h2 style={{ margin: 0 }}>{member.fullName}</h2>
                    <span style={{ padding: "4px 10px", borderRadius: 999, background: "rgba(37, 211, 102, 0.14)", color: "#d1fae5", fontSize: 12, fontWeight: 600 }}>{member.role.toUpperCase()}</span>
                  </div>
                  <p className="text-small">Username: {member.username}</p>
                  <p className="text-small">Phone: {member.phone}</p>
                  <p className="text-small">Status: {member.isActive ? "Active" : "Disabled"}</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn-icon" onClick={() => toggleStatus(member._id, member.isActive)} title="Enable/Disable">
                    <ShieldCheck size={18} />
                  </button>
                  <button className="btn-icon" onClick={() => resetPassword(member._id)} title="Reset Password">
                    <Unlock size={18} />
                  </button>
                  <button className="btn-icon" onClick={() => deleteStaff(member._id)} title="Delete Staff">
                    <Trash2 size={18} />
                  </button>
                  <button className="btn-icon" onClick={() => window.open(`https://wa.me/${member.phone.replace(/\D/g, "")}?text=Hello`, "_blank")} title="Open WhatsApp">
                    <MessageCircle size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => navigate(-1)}
        style={{
          marginTop: 24,
          borderRadius: 14,
          padding: "14px 18px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "transparent",
          color: "white",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
        }}
      >
        <RefreshCcw size={18} /> Back
      </button>

      <AddStaffModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}

export default StaffManagement;
