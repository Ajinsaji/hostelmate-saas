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
  CheckCircle2,
  PlusCircle,
} from "lucide-react";

import { useTheme } from "../design-system/ThemeProvider";
import { useCurrentStorage } from "../contexts/HostelContext";
import SubscriptionBanner from "../components/SubscriptionBanner";
import WorkspaceActivity from "./WorkspaceActivity";
import WorkspaceInsights from "./WorkspaceInsights";

export const DashboardMobile = memo(function DashboardMobile({
  stats,
  pendingCount,
  workspaceData,
  subscriptionData,
  activeHostelId,
  switchHostel,
  vacantRoomsCount,
}) {
  const { colors } = useTheme();
  const { storage } = useCurrentStorage();
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

  const totalBeds = stats?.totalBeds || 0;
  const occupiedBeds = stats?.occupiedBeds || 0;
  const occupancyRate = stats?.occupancyRate || (totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0);
  const pendingRentAmount = stats?.pendingRent || 0;
  const todayAdmissionsCount = stats?.newAdmissionsToday || 0;
  const effectivePendingCount = stats?.pendingAdmissions ?? pendingCount ?? 0;

  // Storage calculation
  const usedMB = workspaceData?.storage?.usedMB || storage?.used || 0;
  const limitMB = workspaceData?.storage?.limitMB || (storage?.limit ? (storage.limit * 1024) : 5120);
  const usedFormatted = typeof usedMB === "number" ? (usedMB < 1024 ? `${usedMB.toFixed(1)} MB` : `${(usedMB / 1024).toFixed(1)} GB`) : `${usedMB}`;
  const limitFormatted = typeof limitMB === "number" ? (limitMB < 1024 ? `${limitMB} MB` : `${(limitMB / 1024).toFixed(0)} GB`) : `${limitMB}`;
  const storagePercent = limitMB > 0 ? Math.min(100, Math.round((usedMB / limitMB) * 100)) : 0;

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
      {/* Dynamic Subscription Banner */}
      {subscriptionData && (
        <SubscriptionBanner
          status={subscriptionData.status}
          daysLeft={subscriptionData.daysRemaining}
          trialEndDate={subscriptionData.trialEndDate}
          expiryDate={subscriptionData.endDate}
          warningLevel={subscriptionData.warningLevel}
          isTrial={subscriptionData.isTrial}
        />
      )}

      {/* QUESTION 1: How is my hostel today? (4 KPI Cards) */}
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
              <div style={{ padding: "6px", borderRadius: "8px", background: "rgba(34, 197, 94, 0.12)", color: "#22C55E", display: "flex" }}>
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
              <div style={{ padding: "6px", borderRadius: "8px", background: "rgba(34, 197, 94, 0.12)", color: "#22C55E", display: "flex" }}>
                <BedDouble size={22} />
              </div>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>
              {occupancyRate}%
            </div>
            <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>
              {occupiedBeds} / {totalBeds} Beds
            </div>
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
              <div style={{ padding: "6px", borderRadius: "8px", background: pendingRentAmount > 0 ? "rgba(245, 158, 11, 0.12)" : "rgba(34, 197, 94, 0.12)", color: pendingRentAmount > 0 ? "#F59E0B" : "#22C55E", display: "flex" }}>
                <Wallet size={22} />
              </div>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>
              ₹{pendingRentAmount.toLocaleString()}
            </div>
            <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>
              {pendingRentAmount > 0 ? "Overdue balance" : "No overdue rent"}
            </div>
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
              <div style={{ padding: "6px", borderRadius: "8px", background: "rgba(34, 197, 94, 0.12)", color: "#22C55E", display: "flex" }}>
                <UserPlus size={22} />
              </div>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>
              {todayAdmissionsCount}
            </div>
            <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>
              {todayAdmissionsCount > 0 ? "New today" : "Admissions today"}
            </div>
          </div>
        </div>
      </section>

      {/* UNIFIED ADMISSIONS SUMMARY SECTION */}
      <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
            Admissions & Approvals
          </h2>
          <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            Review new requests and pending applicants
          </p>
        </div>

        <div
          style={{
            background: colors.background.card || "#131C2E",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                padding: "10px",
                borderRadius: "12px",
                background: "rgba(34, 197, 94, 0.12)",
                color: "#22C55E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <UserPlus size={22} />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>Admissions</div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginTop: "4px", fontSize: "13px" }}>
                <span style={{ color: "#F59E0B", fontWeight: 600 }}>{effectivePendingCount} Awaiting Approval</span>
                <span style={{ color: "#64748B" }}>•</span>
                <span style={{ color: "#22C55E", fontWeight: 600 }}>{todayAdmissionsCount} New Today</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/admissions")}
            style={{
              background: effectivePendingCount > 0 ? "#22C55E" : "rgba(255, 255, 255, 0.05)",
              border: effectivePendingCount > 0 ? "none" : `1px solid ${colors.border.default || "#202B45"}`,
              borderRadius: "12px",
              color: "#FFFFFF",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
            }}
          >
            <span>View Admissions</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* QUESTION 2: What needs attention? */}
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
              <div style={{ padding: "8px", borderRadius: "10px", background: pendingRentAmount > 0 ? "rgba(239, 68, 68, 0.12)" : "rgba(34, 197, 94, 0.12)", color: pendingRentAmount > 0 ? "#EF4444" : "#22C55E", display: "flex" }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>Overdue Rent</div>
                <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>
                  ₹{pendingRentAmount.toLocaleString()} pending
                </div>
              </div>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: pendingRentAmount > 0 ? "#EF4444" : "#22C55E", background: pendingRentAmount > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)", padding: "4px 10px", borderRadius: "9999px" }}>
              {pendingRentAmount > 0 ? "Action Required" : "All caught up"}
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
              <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(148, 163, 184, 0.12)", color: "#94A3B8", display: "flex" }}>
                <FileText size={22} />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>Active Complaints</div>
                <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>0 active issues</div>
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
              {vacantRoomsCount > 0 ? "Ready" : "Full"}
            </div>
          </div>
        </div>
      </section>

      {/* QUESTION 3: What should I do next? (Quick Action Grid) */}
      <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
          What should I do next?
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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

          {/* Action 2: Add Room */}
          <button
            onClick={() => navigate("/rooms")}
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
            <PlusCircle size={22} style={{ color: "#22C55E" }} />
            <span>Add Room</span>
          </button>

          {/* Action 3: New Admission */}
          <button
            onClick={() => navigate("/admissions")}
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
            <UserPlus size={22} style={{ color: "#38BDF8" }} />
            <span>Admissions</span>
          </button>

          {/* Action 4: Collect Payment */}
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

          {/* Action 5: Reports */}
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
              gridColumn: "span 2",
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
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>{usedFormatted} / {limitFormatted}</span>
              </div>
              <div style={{ width: "100%", height: "8px", borderRadius: "9999px", background: "rgba(255, 255, 255, 0.1)", overflow: "hidden" }}>
                <div style={{ width: `${storagePercent}%`, height: "100%", background: "#22C55E", transition: "width 300ms ease" }} />
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
