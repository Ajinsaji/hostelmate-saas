import { useTheme } from "../design-system/ThemeProvider";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { useState } from "react";
import api from "../utils/apiClient";
import toast from "react-hot-toast";
import { Save, X, Lock, Loader2 } from "lucide-react";


function UpdatePassword() {
  const { colors } = useTheme();
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

      const res = await api.put("/api/owner/password/update", payload);

      if (res.data?.success) {
        toast.success(res.data?.message || "Password updated successfully");
        window.history.back();
      } else {
        toast.error(res.data?.message || "Failed to update password");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="Secure your account" subtitle="Update your login password and keep access protected">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${colors.accent.primary}16`, color: colors.accent.primary }}>
              <Lock size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: colors.text.muted }}>Security</p>
              <h2 className="text-lg font-semibold">Change login password</h2>
            </div>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} onClick={() => window.history.back()}>
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: colors.text.muted }}>Current password</p>
            <input className="mt-1 w-full bg-transparent text-sm outline-none" type="password" value={form.currentPassword} onChange={(e) => update("currentPassword", e.target.value)} style={{ color: colors.text.primary }} />
          </div>
          <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: colors.text.muted }}>New password</p>
            <input className="mt-1 w-full bg-transparent text-sm outline-none" type="password" value={form.newPassword} onChange={(e) => update("newPassword", e.target.value)} style={{ color: colors.text.primary }} />
          </div>
          <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: colors.text.muted }}>Confirm password</p>
            <input className="mt-1 w-full bg-transparent text-sm outline-none" type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} style={{ color: colors.text.primary }} />
          </div>
        </div>

        <button className="mt-5 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" onClick={handleSave} disabled={saving} style={{ background: colors.accent.primary, color: "#031018", opacity: saving ? 0.7 : 1 }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving..." : "Update password"}
        </button>
      </Card>
    </PageContainer>
  );
}

export default UpdatePassword;

