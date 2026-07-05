import { useEffect, useState } from "react";
import api from "../utils/apiClient";
import toast from "react-hot-toast";
import buildFileUrl from "../utils/buildFileUrl";
import useOwnerRealtimeSync, { dispatchOwnerSnapshotUpdated } from "../hooks/useOwnerRealtimeSync";
import { Save, X, User, Phone, Mail, Image as ImageIcon, Loader2 } from "lucide-react";
import useGlobalPolling from "../hooks/useGlobalPolling";
import { PageShell, GlassCard, PREMIUM_THEME } from "./PremiumUI";

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
    <PageShell title="Owner Profile" subtitle="Manage your personal details and profile image">
      {loading ? (
        <GlassCard className="text-center">Loading profile...</GlassCard>
      ) : (
        <GlassCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Account details</p>
              <h2 className="mt-1 text-xl font-semibold">Personal profile</h2>
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} onClick={() => window.history.back()}>
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] border" style={{ borderColor: PREMIUM_THEME.border, background: `${PREMIUM_THEME.primary}16` }}>
              {previewUrl ? <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" /> : <User size={32} style={{ color: PREMIUM_THEME.primary }} />}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)" }}>
              <ImageIcon size={16} /> Change image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            </label>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Owner name</p>
              <input className="mt-1 w-full bg-transparent text-sm outline-none" value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} style={{ color: PREMIUM_THEME.text }} />
            </div>
            <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Phone</p>
              <input className="mt-1 w-full bg-transparent text-sm outline-none" value={form.phone} onChange={(e) => update("phone", e.target.value)} inputMode="tel" style={{ color: PREMIUM_THEME.text }} />
            </div>
            <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Email</p>
              <input className="mt-1 w-full bg-transparent text-sm outline-none" value={form.email} onChange={(e) => update("email", e.target.value)} inputMode="email" style={{ color: PREMIUM_THEME.text }} />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="mt-5 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: PREMIUM_THEME.primary, color: "#031018", opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saving ? "Saving..." : "Save profile"}
          </button>
        </GlassCard>
      )}
    </PageShell>
  );
}

export default OwnerProfileEdit;

