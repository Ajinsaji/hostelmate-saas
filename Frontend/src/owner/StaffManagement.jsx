import { useEffect, useState } from "react";
import { api } from "../services/api";
import toast from "react-hot-toast";
import AddStaffModal from "./AddStaffModal";
import useIsMobile from "../hooks/useIsMobile";
import StaffManagementMobile from "./StaffManagementMobile";
import StaffManagementDesktop from "./StaffManagementDesktop";
import ConfirmDialog from "../superadmin/components/modals/ConfirmDialog";

export default function StaffManagement() {
  const isMobile = useIsMobile();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter] = useState("All");

  const fetchStaff = async () => {
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

  useEffect(() => {
    fetchStaff();
  }, []);

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

  const [resetTargetStaff, setResetTargetStaff] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [deleteStaffId, setDeleteStaffId] = useState(null);

  const resetPassword = (staffMember) => {
    setResetTargetStaff(staffMember);
    setNewPasswordInput("");
  };

  const handleConfirmResetPassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newPasswordInput || !resetTargetStaff) return;
    try {
      const response = await api.patch(`/api/staff/${resetTargetStaff._id}/reset-password`, { newPassword: newPasswordInput });
      if (response.data.success) {
        toast.success("Password reset successfully");
        if (response.data.whatsappURL) {
          window.open(response.data.whatsappURL, "_blank");
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to reset password");
    } finally {
      setResetTargetStaff(null);
      setNewPasswordInput("");
    }
  };

  const deleteStaff = (id) => {
    setDeleteStaffId(id);
  };

  const confirmDeleteStaff = async () => {
    if (!deleteStaffId) return;
    try {
      const response = await api.delete(`/api/staff/${deleteStaffId}`);
      if (response.data.success) {
        toast.success("Staff member deleted");
        fetchStaff();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete staff member");
    } finally {
      setDeleteStaffId(null);
    }
  };

  const totalStaff = staff.length;
  const wardensCount = staff.filter((s) => s.userId?.role === "Warden").length;
  const cooksCount = staff.filter((s) => s.userId?.role === "Cook").length;
  const accountantsCount = staff.filter((s) => s.userId?.role === "Accountant").length;
  const activeCount = staff.filter((s) => s.employmentStatus === "Active").length;
  const inactiveCount = staff.filter((s) => s.employmentStatus === "Inactive").length;

  const filteredStaff = staff.filter((member) => {
    const memberRole = member.userId?.role || "";
    const matchesRole = roleFilter === "All" || memberRole.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === "All" || member.employmentStatus.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.userId?.phone?.includes(searchQuery);

    return matchesRole && matchesStatus && matchesSearch;
  });

  return (
    <>
      {isMobile ? (
        <StaffManagementMobile
          staff={staff}
          totalStaff={totalStaff}
          wardensCount={wardensCount}
          cooksCount={cooksCount}
          accountantsCount={accountantsCount}
          activeCount={activeCount}
          inactiveCount={inactiveCount}
          filteredStaff={filteredStaff}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          setIsAddModalOpen={setIsAddModalOpen}
          isAddModalOpen={isAddModalOpen}
          editingStaff={editingStaff}
          setEditingStaff={setEditingStaff}
          handleCreate={handleCreate}
          handleUpdate={handleUpdate}
          toggleStatus={toggleStatus}
          resetPassword={resetPassword}
          deleteStaff={deleteStaff}
        />
      ) : (
        <StaffManagementDesktop
          staff={staff}
          totalStaff={totalStaff}
          wardensCount={wardensCount}
          cooksCount={cooksCount}
          accountantsCount={accountantsCount}
          activeCount={activeCount}
          inactiveCount={inactiveCount}
          filteredStaff={filteredStaff}
          setIsAddModalOpen={setIsAddModalOpen}
          isAddModalOpen={isAddModalOpen}
          editingStaff={editingStaff}
          setEditingStaff={setEditingStaff}
          handleCreate={handleCreate}
          handleUpdate={handleUpdate}
          toggleStatus={toggleStatus}
          resetPassword={resetPassword}
          deleteStaff={deleteStaff}
        />
      )}

      {isAddModalOpen && (
        <AddStaffModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingStaff(null);
          }}
          onSubmit={editingStaff ? handleUpdate : handleCreate}
          initialData={editingStaff}
        />
      )}

      {/* Password Reset Modal */}
      {resetTargetStaff && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#131C2E] border border-[#202B45] rounded-3xl p-6 w-full max-w-md shadow-2xl text-white">
            <h3 className="text-lg font-bold mb-2">Reset Password</h3>
            <p className="text-xs text-slate-300 mb-4">
              Enter a new password for <span className="font-bold text-white">{resetTargetStaff.fullName}</span>:
            </p>
            <form onSubmit={handleConfirmResetPassword} className="space-y-4">
              <input
                type="password"
                required
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setResetTargetStaff(null);
                    setNewPasswordInput("");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Soft Delete Staff Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteStaffId)}
        onClose={() => setDeleteStaffId(null)}
        onConfirm={confirmDeleteStaff}
        title="Delete Staff Member?"
        message="Are you sure you want to delete this staff member? This staff profile will be deactivated."
        confirmLabel="Delete Staff"
        cancelLabel="Cancel"
        isDanger={true}
      />
    </>
  );
}
