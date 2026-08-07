import { memo } from "react";
import { useTheme } from "../design-system/ThemeProvider";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";
import {
  Plus,
  Users,
  ShieldCheck,
  ChefHat,
  Calculator,
  UserCheck,
  UserX,
} from "lucide-react";
import AddStaffModal from "./AddStaffModal";

export const StaffManagementDesktop = memo(function StaffManagementDesktop({
  totalStaff,
  wardensCount,
  cooksCount,
  accountantsCount,
  activeCount,
  inactiveCount,
  filteredStaff,
  setIsAddModalOpen,
  isAddModalOpen,
  editingStaff,
  setEditingStaff,
  handleCreate,
  handleUpdate,
  toggleStatus,
  resetPassword,
  deleteStaff,
}) {
  const { colors } = useTheme();

  return (
    <PageContainer
      title="Staff Management"
      subtitle="Manage hostel wardens, cooks, accountants, and staff members"
      action={
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg transition"
          style={{ background: colors.accent.primary || "#22C55E", color: "#FFFFFF" }}
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

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((s) => (
          <Card key={s._id} className="p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white text-base">{s.fullName}</h4>
                <p className="text-xs text-slate-400">{s.role || "Staff Member"} • {s.phone}</p>
              </div>
              <StatusPill status={s.employmentStatus} />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => toggleStatus(s)}
                className="text-xs text-emerald-400 font-bold hover:underline"
              >
                Toggle Status
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => resetPassword(s)}
                className="text-xs text-slate-300 font-bold hover:underline"
              >
                Reset Password
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => deleteStaff(s._id)}
                className="text-xs text-rose-400 font-bold hover:underline"
              >
                Delete
              </button>
            </div>
          </Card>
        ))}
      </div>

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
    </PageContainer>
  );
});

export default StaffManagementDesktop;
