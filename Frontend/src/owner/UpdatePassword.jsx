import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Save, X, Lock } from "lucide-react";

function UpdatePassword() {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    if (!String(form.currentPassword || "").trim()) {
      toast.error("Current password is required");
      return false;
    }
    if (!String(form.newPassword || "").trim()) {
      toast.error("New password is required");
      return false;
    }
    if (form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return false;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Confirm password must match");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      };

      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/owner/password/update`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        toast.success(res.data?.message || "Password updated successfully");
        window.history.back();
      } else {
        toast.error(res.data?.message || "Failed to update password");
      }
    } catch (e) {
      console.error("Update password error:", e?.response?.data || e);
      toast.error(e?.response?.data?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24" style={{ minHeight: "100vh" }}>
      <div className="gradient-header mb-6">
        <h1 className="text-h1">Update Password</h1>
        <p style={{ opacity: 0.8 }}>Keep your login secure</p>
      </div>

      <div className="p-4">
        <div className="card animate-slide-up" style={{ background: "rgba(11,23,57,0.55)" }}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Lock size={18} color="var(--primary)" />
              <h2 className="text-h2">Change Login Password</h2>
            </div>
            <button className="btn-icon" style={{ width: 40, height: 40 }} onClick={() => window.history.back()}>
              <X size={18} />
            </button>
          </div>

          <div className="input-group">
            <label className="input-label">Current Password</label>
            <input className="input-field" type="password" value={form.currentPassword} onChange={(e) => update("currentPassword", e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">New Password</label>
            <input className="input-field" type="password" value={form.newPassword} onChange={(e) => update("newPassword", e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <input className="input-field" type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} />
          </div>

          <button className="btn-primary mt-4" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
            <Save size={18} /> {saving ? "Saving..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdatePassword;

