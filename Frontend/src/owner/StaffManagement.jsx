import { useTheme } from "../design-system/ThemeProvider";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";
import { EmptyState } from "../design-system/components/EmptyState";
import { useEffect, useState } from "react";
import {
  Plus,
  Users,
  ShieldCheck,
  Phone,
  Mail,
  RefreshCcw,
  Trash2,
  Lock,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Activity,
  ChefHat,
  Calculator,
  UserCheck,
  UserX,
} from "lucide-react";
import { api } from "../services/api";
import toast from "react-hot-toast";
import AddStaffModal from "./AddStaffModal";


export default function StaffManagement() {
  const { colors } = useTheme();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [activityModalStaff, setActivityModalStaff] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/staff");
      if (response.data.success) {
        setStaff(response.data.staff || []);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load staff list");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    try {
      const response = await api.post("/api/staff", formData);
      if (response.data.success) {
        toast.success("Staff account created successfully");
        setIsAddModalOpen(false);
        fetchStaff();
        if (response.data.whatsappURL) {
          window.open(response.data.whatsappURL, "_blank");
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create staff account");
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingStaff) return;
    try {
      const response = await api.put(`/api/staff/${editingStaff._id}`, formData);
      if (response.data.success) {
        toast.success("Staff member updated");
        setEditingStaff(null);
        fetchStaff();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update staff member");
    }
  };

  const toggleStatus = async (staffMember) => {
    const newStatus = staffMember.employmentStatus === "Active" ? "Inactive" : "Active";
    try {
      const response = await api.patch(`/api/staff/${staffMember._id}/status`, { status: newStatus });
      if (response.data.success) {
        toast.success(`Staff account set to ${newStatus}`);
        fetchStaff();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const resetPassword = async (staffMember) => {
    const newPassword = prompt(`Enter new password for ${staffMember.fullName}:`);
    if (!newPassword) return;
    try {
      const response = await api.patch(`/api/staff/${staffMember._id}/reset-password`, { newPassword });
      if (response.data.success) {
        toast.success("Password reset successfully");
        if (response.data.whatsappURL) {
          window.open(response.data.whatsappURL, "_blank");
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to reset password");
    }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm("Are you sure you want to soft delete this staff member?")) return;
    try {
      const response = await api.delete(`/api/staff/${id}`);
      if (response.data.success) {
        toast.success("Staff member deleted");
        fetchStaff();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete staff member");
    }
  };

  const viewActivity = async (staffMember) => {
    setActivityModalStaff(staffMember);
    setLoadingActivity(true);
    try {
      const response = await api.get(`/api/staff/${staffMember._id}/activity`);
      if (response.data.success) {
        setActivityLogs(response.data.activity || []);
      }
    } catch (error) {
      toast.error("Failed to load staff activity log");
    } finally {
      setLoadingActivity(false);
    }
  };

  // Stats calculation
  const totalStaff = staff.length;
  const wardensCount = staff.filter((s) => s.userId?.role === "Warden").length;
  const cooksCount = staff.filter((s) => s.userId?.role === "Cook").length;
  const accountantsCount = staff.filter((s) => s.userId?.role === "Accountant").length;
  const activeCount = staff.filter((s) => s.employmentStatus === "Active").length;
  const inactiveCount = staff.filter((s) => s.employmentStatus === "Inactive").length;

  // Filter staff list
  const filteredStaff = staff.filter((member) => {
    const memberRole = member.userId?.role || "";
    const matchesRole = roleFilter === "All" || memberRole.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === "All" || member.employmentStatus.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.userId?.phone?.includes(searchQuery);

    return matchesRole && matchesStatus && matchesSearch;
  });

  return (
    <PageContainer
      title="Staff & Role-Based Access Control"
      subtitle="Enterprise Staff Management, Roles, and Permissions"
      action={
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg transition"
          style={{ background: colors.accent.primary, color: "#031018" }}
        >
          <Plus size={16} /> Add Staff Member
        </button>
      }
    >
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Staff</span>
            <Users size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-white">{totalStaff}</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Wardens</span>
            <ShieldCheck size={16} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-blue-400">{wardensCount}</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Cooks</span>
            <ChefHat size={16} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-amber-400">{cooksCount}</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Accountants</span>
            <Calculator size={16} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-400">{accountantsCount}</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active</span>
            <UserCheck size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-400">{activeCount}</p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Inactive</span>
            <UserX size={16} className="text-rose-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-rose-400">{inactiveCount}</p>
        </Card>
      </div>

      {/* Filter and Search Toolbar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, code, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <span className="text-xs text-slate-400">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="All">All Roles</option>
                <option value="Warden">Warden</option>
                <option value="Cook">Cook</option>
                <option value="Accountant">Accountant</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Staff Table */}
      {loading ? (
        <Card className="p-8 text-center text-slate-400">Loading staff records...</Card>
      ) : filteredStaff.length === 0 ? (
        <EmptyState title="No staff members found" message="Add a staff member or adjust your filter criteria." />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Emp Code</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Phone / Email</th>
                  <th className="py-3.5 px-4">Salary</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStaff.map((member) => {
                  const role = member.userId?.role || "Staff";
                  const email = member.userId?.email || "";
                  const phone = member.userId?.phone || "";
                  const status = member.employmentStatus || "Active";

                  return (
                    <tr key={member._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {member.photo ? (
                            <img src={member.photo} alt={member.fullName} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-sm">
                              {member.fullName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-white text-sm">{member.fullName}</p>
                            <p className="text-slate-400 text-[11px]">{member.designation}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-emerald-400">{member.employeeCode}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            role === "Warden"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : role === "Cook"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : role === "Accountant"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-slate-500/10 text-slate-400"
                          }`}
                        >
                          {role}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="text-slate-200">{phone}</p>
                        <p className="text-slate-400 text-[11px]">{email}</p>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-200">
                        {member.salary ? `₹${member.salary.toLocaleString("en-IN")}` : "—"}
                      </td>

                      <td className="py-3 px-4">
                        <StatusPill tone={status === "Active" ? "success" : "danger"}>{status}</StatusPill>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => viewActivity(member)}
                            title="Activity Log"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          >
                            <Activity size={14} />
                          </button>
                          <button
                            onClick={() => setEditingStaff(member)}
                            title="Edit Details"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => resetPassword(member)}
                            title="Reset Password"
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition"
                          >
                            <Lock size={14} />
                          </button>
                          <button
                            onClick={() => toggleStatus(member)}
                            title={status === "Active" ? "Deactivate Account" : "Activate Account"}
                            className={`p-1.5 rounded-lg transition ${
                              status === "Active"
                                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {status === "Active" ? <XCircle size={14} /> : <CheckCircle size={14} />}
                          </button>
                          <button
                            onClick={() => deleteStaff(member._id)}
                            title="Delete Staff"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Staff Modal */}
      <AddStaffModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleCreate} />

      {/* Edit Staff Modal */}
      {editingStaff && (
        <AddStaffModal
          isOpen={!!editingStaff}
          onClose={() => setEditingStaff(null)}
          onSubmit={handleUpdate}
          initialData={{
            fullName: editingStaff.fullName,
            email: editingStaff.userId?.email || "",
            phone: editingStaff.userId?.phone || "",
            role: editingStaff.userId?.role || "Warden",
            designation: editingStaff.designation,
            salary: editingStaff.salary || "",
            joiningDate: editingStaff.joiningDate,
            photo: editingStaff.photo || "",
          }}
        />
      )}

      {/* Activity Log Modal */}
      {activityModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-lg">Staff Activity History</h3>
                <p className="text-xs text-slate-400">{activityModalStaff.fullName} ({activityModalStaff.employeeCode})</p>
              </div>
              <button
                onClick={() => setActivityModalStaff(null)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {loadingActivity ? (
              <p className="text-center text-xs text-slate-400 py-6">Loading audit logs...</p>
            ) : activityLogs.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6">No recent activity recorded for this staff member.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {activityLogs.map((log) => (
                  <div key={log._id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-xs">
                    <div className="flex justify-between items-center text-slate-300 font-semibold mb-1">
                      <span>{log.action}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    {log.details && (
                      <p className="text-slate-400 text-[11px] font-mono">
                        {typeof log.details === "object" ? JSON.stringify(log.details) : log.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
