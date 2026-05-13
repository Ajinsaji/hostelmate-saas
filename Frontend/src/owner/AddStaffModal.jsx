import { useState } from "react";
import { X } from "lucide-react";

export default function AddStaffModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({ fullName: "", phone: "", username: "", password: "", role: "warden" });
  const [error, setError] = useState("");

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.phone.trim() || !form.username.trim() || !form.password.trim()) {
      setError("All fields are required");
      return;
    }

    await onSubmit(form);
    setForm({ fullName: "", phone: "", username: "", password: "", role: "warden" });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
      padding: 16,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 520,
        background: "rgba(17, 24, 39, 0.95)",
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
        padding: 24,
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 20,
        }}>
          <div>
            <h2 className="text-h2">Add Staff Member</h2>
            <p className="text-small" style={{ color: "rgba(255,255,255,0.7)" }}>Create wardens or cooks for your hostel.</p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="input-group">
          <label className="input-label">Full Name</label>
          <input className="input-field" value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} placeholder="Enter full name" />
        </div>

        <div className="input-group">
          <label className="input-label">Phone</label>
          <input className="input-field" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="Enter phone number" />
        </div>

        <div className="input-group">
          <label className="input-label">Username</label>
          <input className="input-field" value={form.username} onChange={(e) => handleChange("username", e.target.value)} placeholder="Enter login username" />
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <input type="password" className="input-field" value={form.password} onChange={(e) => handleChange("password", e.target.value)} placeholder="Enter temporary password" />
        </div>

        <div className="input-group">
          <label className="input-label">Role</label>
          <select className="input-field" value={form.role} onChange={(e) => handleChange("role", e.target.value)}>
            <option value="warden">Warden</option>
            <option value="cook">Cook</option>
          </select>
        </div>

        {error && <p className="text-small" style={{ color: "#ff7b7b", marginTop: 10 }}>{error}</p>}

        <button className="btn-primary mt-4" onClick={handleSubmit}>Create Staff</button>
      </div>
    </div>
  );
}
