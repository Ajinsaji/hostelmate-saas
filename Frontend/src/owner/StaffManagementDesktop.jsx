import { memo } from "react";
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

export const StaffManagementDesktop = memo(function StaffManagementDesktop({
  totalStaff,
  wardensCount,
  cooksCount,
  accountantsCount,
  activeCount,
  inactiveCount,
  filteredStaff,
  setIsAddModalOpen,
  setEditingStaff,
  toggleStatus,
  resetPassword,
  deleteStaff,
}) {
  return (
    <PageContainer
      title="Staff Directory"
      subtitle={`${totalStaff} staff member${totalStaff !== 1 ? "s" : ""} across all operational roles`}
      action={
        <button
          type="button"
          onClick={() => {
            if (setEditingStaff) setEditingStaff(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg transition hover:brightness-110 active:scale-95 cursor-pointer"
          style={{
            background: "#22C55E",
            color: "#FFFFFF",
            boxShadow: "0 4px 14px rgba(34, 197, 94, 0.35)",
            minHeight: "44px",
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add Staff</span>
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
                <p className="text-xs text-slate-400">
                  {s.employeeCode ? `${s.employeeCode} • ` : ""}
                  {s.userId?.role || s.designation || s.role || "Staff Member"} • {s.userId?.phone || s.phone || "No phone"}
                </p>
                {s.userId?.email && (
                  <p className="text-[11px] text-slate-500 truncate">{s.userId.email}</p>
                )}
              </div>
              <StatusPill status={s.employmentStatus} />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (setEditingStaff) setEditingStaff(s);
                  setIsAddModalOpen(true);
                }}
                className="text-xs text-blue-400 font-bold hover:underline"
              >
                Edit
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => toggleStatus(s)}
                className="text-xs text-emerald-400 font-bold hover:underline"
              >
                Toggle Status
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => resetPassword(s)}
                className="text-xs text-slate-300 font-bold hover:underline"
              >
                Reset Password
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => deleteStaff(s._id)}
                className="text-xs text-rose-400 font-bold hover:underline"
              >
                Delete
              </button>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
});

export default StaffManagementDesktop;
