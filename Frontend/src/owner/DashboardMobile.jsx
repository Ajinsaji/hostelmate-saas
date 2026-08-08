import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BedDouble,
  Wallet,
  FileText,
  Sparkles,
  IndianRupee,
  Building,
  AlertTriangle,
  Receipt,
  UserPlus,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  HardDrive,
  CheckCircle2
} from "lucide-react";

import { useTheme } from "../design-system/ThemeProvider";
import WorkspaceActivity from "./WorkspaceActivity";
import WorkspaceInsights from "./WorkspaceInsights";

export const DashboardMobile = memo(function DashboardMobile({
  stats,
  pendingCount,
  workspaceData,
  activeHostelId,
  switchHostel,
  vacantRoomsCount,
}) {
  const { colors } = useTheme();
  const navigate = useNavigate();

  // Accordion toggle state for below-the-fold content
  const [openSections, setOpenSections] = useState({
    ai: false,
    activity: false,
    storage: false,
    hostels: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "24px",
        boxSizing: "border-box",
        maxWidth: "100%",
      }}
    >
      {/* ========================================================================= */}
      {/* 5-SECOND ANSWER — ABOVE THE FOLD                                          */}
      {/* ========================================================================= */}

      {/* QUESTION 1: How is my hostel today? (4 KPI Cards Only) */}
      <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
            How is my hostel today?
          </h2>
          <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            Key metrics at a glance
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Revenue KPI */}
          <div
            style={{
              background: colors.background.card || "#131C2E",
              border: `1px solid ${colors.border.default || "#202B45"}`,
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Today's Revenue</span>
              <div style={{ p: "6px", borderRadius: "8px", background: "rgba(34, 197, 94, 0.12)", color: "#22C55E", display: "flex" }}>
                <IndianRupee size={22} />
              </div>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>
              ₹{(stats?.todayCollection || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Collected today</div>
          </div>

          {/* Occupancy KPI */}
          <div
            style={{
              background: colors.background.card || "#131C2E",
              border: `1px solid ${colors.border.default || "#202B45"}`,
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Occupancy</span>
              <div style={{ p: "6px", borderRadius: "8px", background: "rgba(34, 197, 94, 0.12)", color: "#22C55E", display: "flex" }}>
                <BedDouble size={22} />
              </div>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>
              {stats?.occupancyRate || 0}%
            </div>
            <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Bunks occupied</div>
          </div>

          {/* Pending Rent KPI */}
          <div
            style={{
              background: colors.background.card || "#131C2E",
              border: `1px solid ${colors.border.default || "#202B45"}`,
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Pending Rent</span>
              <div style={{ p: "6px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.12)", color: "#F59E0B", display: "flex" }}>
                <Wallet size={22} />
              </div>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>
              ₹{(stats?.pendingRent || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Overdue balance</div>
          </div>

          {/* Today's Admissions KPI */}
          <div
            style={{
              background: colors.background.card || "#131C2E",
              border: `1px solid ${colors.border.default || "#202B45"}`,
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Admissions</span>
              <div style={{ p: "6px", borderRadius: "8px", background: "rgba(34, 197, 94, 0.12)", color: "#22C55E", display: "flex" }}>
                <UserPlus size={22} />
              </div>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>
              {pendingCount || 0}
            </div>
            <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Pending approval</div>
          </div>
        </div>
      </section>

      {/* QUESTION 2: What needs attention? (Single Compact Card) */}
      <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
            What needs attention?
          </h2>
          <button
            onClick={() => navigate("/payments?tab=pending")}
            style={{
              background: "transparent",
              border: "none",
              color: "#22C55E",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              minHeight: "48px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            View All <ArrowRight size={16} />
          </button>
        </div>

        <div
          style={{
            background: colors.background.card || "#131C2E",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Overdue Rent Row */}
          <div
            onClick={() => navigate("/payments?tab=pending")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.12)", color: "#EF4444", display: "flex" }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>Overdue Rent</div>
                <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>
                  ₹{(stats?.pendingRent || 0).toLocaleString()} pending
                </div>
              </div>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#EF4444", background: "rgba(239, 68, 68, 0.1)", padding: "4px 10px", borderRadius: "9999px" }}>
              Action Required
            </div>
          </div>

          <div style={{ height: "1px", background: colors.border.default || "#202B45" }} />

          {/* Active Complaints Row */}
          <div
            onClick={() => navigate("/owner/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.12)", color: "#F59E0B", display: "flex" }}>
                <FileText size={22} />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>Active Complaints</div>
                <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>0 pending issues</div>
              </div>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#22C55E", background: "rgba(34, 197, 94, 0.1)", padding: "4px 10px", borderRadius: "9999px" }}>
              All Clear
            </div>
          </div>

          <div style={{ height: "1px", background: colors.border.default || "#202B45" }} />

          {/* Vacant Rooms Row */}
          <div
            onClick={() => navigate("/rooms?filter=vacant")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(34, 197, 94, 0.12)", color: "#22C55E", display: "flex" }}>
                <BedDouble size={22} />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>Vacant Rooms</div>
                <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>
                  {vacantRoomsCount} available space{vacantRoomsCount !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#22C55E", background: "rgba(34, 197, 94, 0.1)", padding: "4px 10px", borderRadius: "9999px" }}>
              Ready
            </div>
          </div>
        </div>
      </section>

      {/* QUESTION 3: What should I do next? (4 Large Primary Buttons) */}
      <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
          What should I do next?
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Action 1: Add Resident */}
          <button
            onClick={() => navigate("/residents?action=add")}
            style={{
              background: "#22C55E",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "14px",
              padding: "16px 12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              minHeight: "48px",
              boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
            }}
          >
            <UserPlus size={22} />
            <span>Add Resident</span>
          </button>

          {/* Action 2: Collect Payment */}
          <button
            onClick={() => navigate("/payments?action=collect")}
            style={{
              background: colors.background.card || "#131C2E",
              color: "#FFFFFF",
              border: `1px solid ${colors.border.default || "#202B45"}`,
              borderRadius: "14px",
              padding: "16px 12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              minHeight: "48px",
            }}
          >
            <Wallet size={22} style={{ color: "#22C55E" }} />
            <span>Collect Payment</span>
          </button>

          {/* Action 3: Add Expense */}
          <button
            onClick={() => navigate("/owner/expense-dashboard?action=add")}
            style={{
              background: colors.background.card || "#131C2E",
              color: "#FFFFFF",
              border: `1px solid ${colors.border.default || "#202B45"}`,
              borderRadius: "14px",
              padding: "16px 12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              minHeight: "48px",
            }}
          >
            <Receipt size={22} style={{ color: "#F59E0B" }} />
            <span>Add Expense</span>
          </button>

          {/* Action 4: Reports */}
          <button
            onClick={() => navigate("/reports")}
            style={{
              background: colors.background.card || "#131C2E",
              color: "#FFFFFF",
              border: `1px solid ${colors.border.default || "#202B45"}`,
              borderRadius: "14px",
              padding: "16px 12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              minHeight: "48px",
            }}
          >
            <FileText size={22} style={{ color: "#94A3B8" }} />
            <span>Reports</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BELOW THE FOLD — SECONDARY MODULES (Collapsible Accordions)               */}
      {/* ========================================================================= */}

      <div style={{ height: "1px", background: colors.border.default || "#202B45", margin: "8px 0" }} />

      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
          More Insights & Activity
        </h2>

        {/* Accordion 1: AI Insights */}
        <div
          style={{
            background: colors.background.card || "#131C2E",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => toggleSection("ai")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px",
              background: "transparent",
              border: "none",
              color: "#FFFFFF",
              cursor: "pointer",
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Sparkles size={22} style={{ color: "#22C55E" }} />
              <span style={{ fontSize: "16px", fontWeight: 700 }}>AI Insights</span>
            </div>
            {openSections.ai ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
          </button>

          {openSections.ai && (
            <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${colors.border.default || "#202B45"}` }}>
              <div style={{ paddingTop: "16px" }}>
                <WorkspaceInsights />
              </div>
            </div>
          )}
        </div>

        {/* Accordion 2: Recent Activity */}
        <div
          style={{
            background: colors.background.card || "#131C2E",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => toggleSection("activity")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px",
              background: "transparent",
              border: "none",
              color: "#FFFFFF",
              cursor: "pointer",
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FileText size={22} style={{ color: "#94A3B8" }} />
              <span style={{ fontSize: "16px", fontWeight: 700 }}>Recent Activity</span>
            </div>
            {openSections.activity ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
          </button>

          {openSections.activity && (
            <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${colors.border.default || "#202B45"}` }}>
              <div style={{ paddingTop: "16px" }}>
                <WorkspaceActivity />
              </div>
            </div>
          )}
        </div>

        {/* Accordion 3: Drive Storage */}
        <div
          style={{
            background: colors.background.card || "#131C2E",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => toggleSection("storage")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px",
              background: "transparent",
              border: "none",
              color: "#FFFFFF",
              cursor: "pointer",
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <HardDrive size={22} style={{ color: "#22C55E" }} />
              <span style={{ fontSize: "16px", fontWeight: 700 }}>Cloud Storage</span>
            </div>
            {openSections.storage ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
          </button>

          {openSections.storage && (
            <div style={{ padding: "16px 20px 20px", borderTop: `1px solid ${colors.border.default || "#202B45"}`, display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Storage Used</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>15.6 MB / 100 MB</span>
              </div>
              <div style={{ width: "100%", height: "8px", borderRadius: "9999px", background: "rgba(255, 255, 255, 0.1)", overflow: "hidden" }}>
                <div style={{ width: "15.6%", height: "100%", background: "#22C55E" }} />
              </div>
              <button
                onClick={() => navigate("/owner/storage-center")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#22C55E",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  minHeight: "48px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  alignSelf: "flex-start",
                }}
              >
                Manage Cloud Storage <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Accordion 4: Workspace Hostels */}
        {workspaceData && (
          <div
            style={{
              background: colors.background.card || "#131C2E",
              border: `1px solid ${colors.border.default || "#202B45"}`,
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => toggleSection("hostels")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px",
                background: "transparent",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
                minHeight: "48px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Building size={22} style={{ color: "#22C55E" }} />
                <span style={{ fontSize: "16px", fontWeight: 700 }}>Hostels in Workspace</span>
              </div>
              {openSections.hostels ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
            </button>

            {openSections.hostels && (
              <div style={{ padding: "16px 20px 20px", borderTop: `1px solid ${colors.border.default || "#202B45"}`, display: "flex", flexDirection: "column", gap: "12px" }}>
                {workspaceData.hostels?.map((h) => {
                  const isActive = (h.id || h._id) === activeHostelId;
                  return (
                    <div
                      key={h.id || h._id}
                      onClick={() => switchHostel(h.id || h._id)}
                      style={{
                        padding: "12px",
                        borderRadius: "12px",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: `1px solid ${colors.border.default || "#202B45"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        minHeight: "48px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>{h.name}</div>
                        <div style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8" }}>{h.city || h.address || "Hostel Location"}</div>
                      </div>
                      {isActive && <CheckCircle2 size={20} style={{ color: "#22C55E" }} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
});

export default DashboardMobile;
