import { useEffect, useState } from "react";
import { api } from "../services/api";
import toast from "react-hot-toast";
import AddStaffModal from "./AddStaffModal";
import useIsMobile from "../hooks/useIsMobile";
import StaffManagementMobile from "./StaffManagementMobile";
import StaffManagementDesktop from "./StaffManagementDesktop";

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

  if (isMobile) {
    return (
      <>
        <StaffManagementMobile
          staff={staff}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          setIsAddModalOpen={setIsAddModalOpen}
          setEditingStaff={setEditingStaff}
          toggleStatus={toggleStatus}
          resetPassword={resetPassword}
          deleteStaff={deleteStaff}
        />
        {(isAddModalOpen || editingStaff) && (
          <AddStaffModal
            isOpen={isAddModalOpen || !!editingStaff}
            onClose={() => {
              setIsAddModalOpen(false);
              setEditingStaff(null);
            }}
            onSubmit={editingStaff ? handleUpdate : handleCreate}
            initialData={editingStaff}
          />
        )}
      </>
    );
  }

  return (
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
  );
}
