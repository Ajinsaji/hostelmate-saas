import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Save, X, User, Phone, Mail, Image as ImageIcon } from "lucide-react";

function OwnerProfileEdit() {
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    ownerName: "",
    phone: "",
    email: "",
  });

  const [profileFile, setProfileFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const fetchOwner = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/owner/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // dashboard returns { hostel, stats } currently; owner details may only exist in localStorage
      // fallback to localStorage.
      const user = JSON.parse(localStorage.getItem("user") || "null") || {};

      setForm({
        ownerName: user.ownerName || "",
        phone: user.phone || "",
        email: user.email || "",
      });

      // optional: if backend sends profileImage in owner endpoint; keep best-effort.
      if (user.profileImage) {
        setPreviewUrl(`${import.meta.env.VITE_API_URL}/uploads/${user.profileImage}`);
      }
    } catch (e) {
      console.error("Owner profile load error:", e);
      toast.error("Failed to load owner profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    if (!String(form.ownerName || "").trim()) {
      toast.error("Owner name is required");
      return false;
    }
    if (!String(form.phone || "").trim()) {
      toast.error("Phone is required");
      return false;
    }
    if (!String(form.email || "").trim()) {
      toast.error("Email is required");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      const data = new FormData();
      data.append("ownerName", form.ownerName);
      data.append("phone", form.phone);
      data.append("email", form.email);
      if (profileFile) data.append("profileImage", profileFile);

      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/owner/profile/update`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.data?.success) {
        toast.error(res.data?.message || "Failed to update profile");
        return;
      }

      toast.success(res.data?.message || "Profile updated");

      // Refresh owner snapshot (best-effort) so next screens show updated data
      try {
        const dash = await axios.get(`${import.meta.env.VITE_API_URL}/api/owner/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const current = JSON.parse(localStorage.getItem("user") || "null") || {};
        const owner = dash.data?.owner || dash.data?.user || dash.data?.data?.owner || null;

        const next = {
          ...current,
          ownerName: owner?.ownerName || res.data?.owner?.ownerName || form.ownerName,
          phone: owner?.phone || res.data?.owner?.phone || form.phone,
          email: owner?.email || res.data?.owner?.email || form.email,
        };
        if (owner?.profileImage || res.data?.owner?.profileImage) {
          next.profileImage = owner?.profileImage || res.data.owner.profileImage;
        }

        localStorage.setItem("user", JSON.stringify(next));
      } catch (e) {
        // non-fatal; user already got success toast
      }

      window.history.back();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleFile = (file) => {
    setProfileFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  return (
    <div className="pb-24" style={{ minHeight: "100vh" }}>
      <div className="gradient-header mb-6">
        <h1 className="text-h1">Owner Profile</h1>
        <p style={{ opacity: 0.8 }}>Edit your personal info</p>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="card glass-card animate-pulse" style={{ background: "rgba(11,23,57,0.55)" }}>
            Loading...
          </div>
        ) : (
          <div className="card animate-slide-up" style={{ background: "rgba(11,23,57,0.55)" }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-h2">Account Details</h2>
              <button className="btn-icon" style={{ width: 40, height: 40 }} onClick={() => window.history.back()}>
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 24,
                  background: "rgba(15,93,70,0.25)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <User size={36} color="var(--primary)" />
                )}
              </div>

              <label
                className="btn-secondary"
                style={{ width: "auto", padding: "12px 14px", cursor: "pointer" }}
              >
                <ImageIcon size={18} />
                Change Image
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0])} />
              </label>
            </div>

            <div className="input-group">
              <label className="input-label">Owner Name</label>
              <input className="input-field" value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label">Phone</label>
              <input className="input-field" value={form.phone} onChange={(e) => update("phone", e.target.value)} inputMode="tel" />
            </div>

            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input-field" value={form.email} onChange={(e) => update("email", e.target.value)} inputMode="email" />
            </div>

            <button
              className="btn-primary mt-4"
              onClick={handleSave}
              disabled={saving}
              style={{ opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
            >
              <Save size={18} /> {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerProfileEdit;

