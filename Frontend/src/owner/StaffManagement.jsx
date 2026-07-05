import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MessageCircle, RefreshCcw, Trash2, Unlock, ShieldCheck, Users, Phone, Sparkles } from "lucide-react";
import { api } from "../services/api";
import toast from "react-hot-toast";
import AddStaffModal from "./AddStaffModal";
import { PageShell, GlassCard, StatusPill, EmptyState, PREMIUM_THEME } from "./PremiumUI";

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
      toast.error(error?.response?.data?.message || "Unable to load staff members");
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
    <PageShell title="Staff" subtitle="Manage wardens, cooks, and house operations" action={<button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: PREMIUM_THEME.primary, color: "#031018" }}><Plus size={16} /> Add staff</button>}>
      <GlassCard>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${PREMIUM_THEME.primary}16`, color: PREMIUM_THEME.primary }}><Users size={18} /></div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Team overview</p>
            <p className="mt-1 text-lg font-semibold">{staff.length} active staff members</p>
          </div>
        </div>
      </GlassCard>

      {loading ? <GlassCard className="text-center">Loading staff...</GlassCard> : staff.length === 0 ? <EmptyState title="No staff yet" message="Create your first team member to start managing operations." /> : (
        <div className="space-y-3">
          {staff.map((member) => (
            <GlassCard key={member._id} hover>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${PREMIUM_THEME.primary}16`, color: PREMIUM_THEME.primary }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{member.fullName}</h3>
                      <StatusPill tone={member.isActive ? "success" : "danger"}>{member.role?.toUpperCase() || "STAFF"}</StatusPill>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: PREMIUM_THEME.muted }}><span className="inline-flex items-center gap-1"><Phone size={14} /> {member.phone}</span></p>
                    <p className="mt-1 text-sm" style={{ color: PREMIUM_THEME.muted }}>Username: {member.username}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-full px-3 py-2 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)" }} onClick={() => toggleStatus(member._id, member.isActive)}>{member.isActive ? "Deactivate" : "Activate"}</button>
                  <button className="rounded-full px-3 py-2 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)" }} onClick={() => resetPassword(member._id)}>Reset password</button>
                  <button className="rounded-full px-3 py-2 text-sm font-semibold" style={{ background: "rgba(235,87,87,0.14)", color: PREMIUM_THEME.danger }} onClick={() => deleteStaff(member._id)}>Delete</button>
                  <button className="rounded-full px-3 py-2 text-sm font-semibold" style={{ background: "rgba(45,156,219,0.16)", color: PREMIUM_THEME.accent }} onClick={() => window.open(`https://wa.me/${member.phone.replace(/\D/g, "")}?text=Hello`, "_blank")}>WhatsApp</button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <AddStaffModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />
    </PageShell>
  );
}

export default StaffManagement;
