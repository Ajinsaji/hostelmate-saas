import { useEffect, useState } from "react";
import api from "../utils/apiClient";
import toast from "react-hot-toast";
import buildFileUrl from "../utils/buildFileUrl";
import useOwnerRealtimeSync, { dispatchOwnerSnapshotUpdated } from "../hooks/useOwnerRealtimeSync";
import { Save, X, User, Phone, Mail, Image as ImageIcon, Loader2 } from "lucide-react";
import useGlobalPolling from "../hooks/useGlobalPolling";

function OwnerProfileEdit() {
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
      const res = await api.get("/api/owner/dashboard");
      const payload = res.data || {};
      const owner = payload.owner || JSON.parse(localStorage.getItem("ownerUser") || "null") || {};

      setForm({
        ownerName: owner.ownerName || "",
        phone: owner.phone || "",
        email: owner.email || "",
      });

      if (owner.profileImage) {
        setPreviewUrl(buildFileUrl(owner.profileImage));
      }

      if (payload.owner) {
        localStorage.setItem("ownerUser", JSON.stringify({
          ...JSON.parse(localStorage.getItem("ownerUser") || "{}"),
          ...payload.owner,
        }));
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load owner profile");
    } finally {
      setLoading(false);
    }
  };

  const safeRefreshProps = {
    isEditing: Boolean(profileFile),
    isSubmitting: saving,
    showModal: Boolean(profileFile),
    isUploading: Boolean(profileFile),
  };

  useOwnerRealtimeSync({
    onSnapshotChange: (snapshot) => {
      if (profileFile || saving) return;
      setForm((prev) => ({
        ownerName: snapshot.ownerName || prev.ownerName,
        phone: snapshot.phone || prev.phone,
        email: snapshot.email || prev.email,
      }));
      if (snapshot.profileImage) {
        setPreviewUrl(buildFileUrl(snapshot.profileImage));
      }
    },
    safeProps: safeRefreshProps,
  });

  useEffect(() => {
    fetchOwner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useGlobalPolling(fetchOwner, { interval: 9000, safeProps: safeRefreshProps });

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

      const res = await api.put("/api/owner/profile/update", data);

      if (!res.data?.success) {
        toast.error(res.data?.message || "Failed to update profile");
        return;
      }

      toast.success(res.data?.message || "Profile updated");

      const updatedOwner = res.data?.data?.owner || res.data?.owner || {};
      const current = JSON.parse(localStorage.getItem("ownerUser") || "null") || {};
      const next = {
        ...current,
        ownerName: updatedOwner.ownerName || form.ownerName,
        phone: updatedOwner.phone || form.phone,
        email: updatedOwner.email || form.email,
        username: updatedOwner.username || current.username,
      };
      if (updatedOwner.profileImage) {
        next.profileImage = updatedOwner.profileImage;
      }
      localStorage.setItem("ownerUser", JSON.stringify(next));
      dispatchOwnerSnapshotUpdated({
        ownerName: next.ownerName,
        profileImage: next.profileImage,
        email: next.email,
        phone: next.phone,
        username: next.username,
      });

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
              <button
                className="btn-icon"
                style={{
                  width: 40,
                  height: 40,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "white",
                }}
                onClick={() => window.history.back()}
              >
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
              style={{ opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerProfileEdit;

