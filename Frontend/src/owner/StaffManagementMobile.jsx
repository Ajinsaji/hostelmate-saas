import { useState, memo } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Lock,
  X
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";

export const StaffManagementMobile = memo(function StaffManagementMobile({
  staff,
  loading,
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  setIsAddModalOpen,
  setEditingStaff,
  toggleStatus,
  resetPassword,
  deleteStaff,
}) {
  const { colors } = useTheme();
  const [activeMenuId, setActiveMenuId] = useState(null);

  const roleOptions = ["All", "Warden", "Cook", "Accountant"];

  const filteredStaff = staff.filter((s) => {
    const nameMatch = !searchQuery || s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || s.phone?.includes(searchQuery);
    const roleMatch = roleFilter === "All" || s.role === roleFilter;
    return nameMatch && roleMatch;
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "24px",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      {/* 1. Header & Title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
            Staff Directory
          </h1>
          <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            {staff.length} staff member{staff.length !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            background: "#22C55E",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "14px",
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            minHeight: "48px",
            boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
          }}
        >
          <Plus size={20} />
          <span>Add</span>
        </button>
      </div>

      {/* 2. Mobile Search Input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          background: colors.background.card || "#131C2E",
          border: `1px solid ${colors.border.default || "#202B45"}`,
          borderRadius: "14px",
        }}
      >
        <Search size={22} style={{ color: colors.text.secondary || "#94A3B8" }} />
        <input
          type="text"
          placeholder="Search staff by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#FFFFFF",
            fontSize: "14px",
            width: "100%",
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* 3. Role Filter Chips */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
        {roleOptions.map((role) => {
          const isSel = roleFilter === role;
          return (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              style={{
                background: isSel ? "#22C55E" : colors.background.card || "#131C2E",
                color: isSel ? "#FFFFFF" : colors.text.secondary || "#94A3B8",
                border: `1px solid ${isSel ? "#22C55E" : colors.border.default || "#202B45"}`,
                borderRadius: "9999px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: isSel ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                minHeight: "48px",
              }}
            >
              {role}
            </button>
          );
        })}
      </div>

      {/* 4. Vertically Stacked Staff Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: colors.text.secondary || "#94A3B8", fontSize: "14px" }}>
            Loading staff roster...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              background: colors.background.card || "#131C2E",
              borderRadius: "16px",
              border: `1px solid ${colors.border.default || "#202B45"}`,
              color: colors.text.secondary || "#94A3B8",
            }}
          >
            No staff members found. Tap <strong>Add</strong> to invite a warden or staff member.
          </div>
        ) : (
          filteredStaff.map((s) => {
            const isActive = s.employmentStatus === "Active";
            const isMenuOpen = activeMenuId === s._id;

            return (
              <div
                key={s._id}
                style={{
                  background: colors.background.card || "#131C2E",
                  border: `1px solid ${colors.border.default || "#202B45"}`,
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "rgba(34, 197, 94, 0.15)",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#22C55E",
                        fontWeight: 700,
                        fontSize: "16px",
                      }}
                    >
                      {s.fullName?.slice(0, 1).toUpperCase() || "S"}
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>{s.fullName}</div>
                      <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>
                        {s.role || "Staff"} • {s.phone}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveMenuId(isMenuOpen ? null : s._id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: colors.text.secondary || "#94A3B8",
                      cursor: "pointer",
                      padding: "8px",
                      minHeight: "44px",
                      minWidth: "44px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label="Staff options"
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button
                    onClick={() => toggleStatus(s)}
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "4px 12px",
                      borderRadius: "9999px",
                      border: "none",
                      background: isActive ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                      color: isActive ? "#22C55E" : "#EF4444",
                      cursor: "pointer",
                      minHeight: "36px",
                    }}
                  >
                    {isActive ? "Status: Active" : "Status: Inactive"}
                  </button>

                  <button
                    onClick={() => resetPassword(s)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94A3B8",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      minHeight: "44px",
                    }}
                  >
                    <Lock size={14} /> Reset Pass
                  </button>
                </div>

                {isMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "60px",
                      right: "20px",
                      background: "#131C2E",
                      border: `1px solid ${colors.border.default || "#202B45"}`,
                      borderRadius: "12px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                      zIndex: 50,
                      display: "flex",
                      flexDirection: "column",
                      width: "160px",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => {
                        setActiveMenuId(null);
                        setEditingStaff(s);
                        setIsAddModalOpen(true);
                      }}
                      style={{
                        padding: "12px 16px",
                        background: "transparent",
                        border: "none",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        textAlign: "left",
                        cursor: "pointer",
                        minHeight: "44px",
                      }}
                    >
                      Edit Account
                    </button>
                    <button
                      onClick={() => {
                        setActiveMenuId(null);
                        deleteStaff(s._id);
                      }}
                      style={{
                        padding: "12px 16px",
                        background: "transparent",
                        border: "none",
                        color: "#EF4444",
                        fontSize: "13px",
                        textAlign: "left",
                        cursor: "pointer",
                        minHeight: "44px",
                        borderTop: `1px solid ${colors.border.default || "#202B45"}`,
                      }}
                    >
                      Delete Account
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

export default StaffManagementMobile;
