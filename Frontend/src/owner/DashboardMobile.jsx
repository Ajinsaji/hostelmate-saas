import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BedDouble,
  Users,
  UserPlus,
  CreditCard,
  Receipt,
  Calendar,
  AlertCircle,
  Wrench,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HardDrive,
  Building,
  CheckCircle2,
  ArrowRight,
  ArrowUp,
} from "lucide-react";

import { useTheme } from "../design-system/ThemeProvider";
import { useCurrentStorage } from "../contexts/HostelContext";
import SubscriptionBanner from "../components/SubscriptionBanner";
import WorkspaceActivity from "./WorkspaceActivity";
import WorkspaceInsights from "./WorkspaceInsights";
import HostelSwitcher from "../design-system/components/HostelSwitcher";

export const DashboardMobile = memo(function DashboardMobile({
  stats,
  pendingCount,
  workspaceData,
  subscriptionData,
  activeHostelId,
  switchHostel,
  attentionMetrics,
  ownerName,
  navigate: propNavigate,
}) {
  const { colors } = useTheme();
  const { storage } = useCurrentStorage();
  const hookNavigate = useNavigate();
  const navigate = propNavigate || hookNavigate;

  // Accordion toggle state for below-the-fold modules
  const [openSections, setOpenSections] = useState({
    ai: false,
    activity: false,
    storage: false,
    hostels: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Metrics calculations
  const totalBeds = stats?.totalBeds || 0;
  const occupiedBeds = stats?.occupiedBeds || 0;
  const availableBeds = Math.max(0, stats?.vacancy ?? (totalBeds - occupiedBeds));
  const occupancyRate = stats?.occupancyRate ?? (totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0);
  const effectivePendingCount = attentionMetrics?.pendingAdmissionsCount ?? stats?.pendingAdmissions ?? pendingCount ?? 0;

  // Dynamic time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };
  const greetingText = `${getGreeting()}, ${ownerName || "Ajin"} 👋`;

  // Storage calculations
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
        gap: "18px",
        padding: "4px 0 24px",
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "100%",
      }}
    >
      {/* Dynamic Subscription / Free Trial Banner */}
      {subscriptionData && (
        <SubscriptionBanner
          status={subscriptionData.status || subscriptionData.subscription?.status}
          daysLeft={subscriptionData.daysRemaining ?? subscriptionData.subscription?.daysRemaining ?? subscriptionData.daysLeft}
          trialEndDate={subscriptionData.trialEndDate ?? subscriptionData.subscription?.trialEndDate ?? subscriptionData.subscription?.expiresAt}
          expiryDate={subscriptionData.endDate ?? subscriptionData.subscription?.endDate ?? subscriptionData.subscription?.expiresAt}
          warningLevel={subscriptionData.warningLevel}
          isTrial={subscriptionData.isTrial ?? subscriptionData.subscription?.isTrial}
        />
      )}

      {/* 1. GREETING & HOSTEL SELECTOR ROW */}
      <section style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <h1
            style={{
              fontSize: "clamp(17px, 4.8vw, 20px)",
              fontWeight: 800,
              color: "#FFFFFF",
              margin: 0,
              letterSpacing: "-0.3px",
              lineHeight: 1.2,
              minWidth: 0,
              flex: 1,
            }}
          >
            {greetingText}
          </h1>

          <div style={{ flexShrink: 0 }}>
            <HostelSwitcher variant="pill" dropdownPosition="bottom" />
          </div>
        </div>

        <p
          style={{
            fontSize: "13px",
            color: "#64748B",
            margin: 0,
            fontWeight: 500,
          }}
        >
          Here's what's happening at your hostel today.
        </p>
      </section>

      {/* 2. TOP METRIC CARDS (2-Column Grid) */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {/* Card 1: Available Beds */}
        <div
          onClick={() => navigate("/rooms")}
          role="button"
          tabIndex={0}
          style={{
            background: "#111C2C",
            border: "1px solid #1E293B",
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "transform 150ms ease, border-color 150ms ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: "rgba(34, 197, 94, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#22C55E",
                flexShrink: 0,
              }}
            >
              <BedDouble size={24} />
            </div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.1 }}>
                {availableBeds}
              </div>
              <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 500, marginTop: "2px" }}>
                Beds available
              </div>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: "#64748B", flexShrink: 0 }} />
        </div>

        {/* Card 2: Pending Admissions / Requests */}
        <div
          onClick={() => navigate("/admissions")}
          role="button"
          tabIndex={0}
          style={{
            background: "#111C2C",
            border: "1px solid #1E293B",
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "transform 150ms ease, border-color 150ms ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: "rgba(245, 158, 11, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#F59E0B",
                flexShrink: 0,
              }}
            >
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.1 }}>
                {effectivePendingCount}
              </div>
              <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 500, marginTop: "2px", lineHeight: 1.2 }}>
                Pending
                <span style={{ display: "block", fontSize: "10px", color: "#64748B" }}>Admissions / Requests</span>
              </div>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: "#64748B", flexShrink: 0 }} />
        </div>
      </section>

      {/* 3. QUICK ACTIONS */}
      <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
            Quick Actions
          </h2>
          <button
            onClick={() => navigate("/residents")}
            style={{
              background: "transparent",
              border: "none",
              color: "#22C55E",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              gap: "2px",
            }}
          >
            View all &gt;
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {/* Quick Action 1: New Admission */}
          <button
            onClick={() => navigate("/admissions")}
            style={{
              background: "#111C2C",
              border: "1px solid #1E293B",
              borderRadius: "16px",
              padding: "16px 6px 14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              outline: "none",
              minHeight: "92px",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "rgba(34, 197, 94, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#22C55E",
              }}
            >
              <UserPlus size={20} />
            </div>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#FFFFFF", textAlign: "center", lineHeight: 1.2 }}>
              New<br />Admission
            </span>
          </button>

          {/* Quick Action 2: Add Resident */}
          <button
            onClick={() => navigate("/residents?action=add")}
            style={{
              background: "#111C2C",
              border: "1px solid #1E293B",
              borderRadius: "16px",
              padding: "16px 6px 14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              outline: "none",
              minHeight: "92px",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "rgba(56, 189, 248, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38BDF8",
              }}
            >
              <Users size={20} />
            </div>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#FFFFFF", textAlign: "center", lineHeight: 1.2 }}>
              Add<br />Resident
            </span>
          </button>

          {/* Quick Action 3: Collect Rent */}
          <button
            onClick={() => navigate("/payments?action=collect")}
            style={{
              background: "#111C2C",
              border: "1px solid #1E293B",
              borderRadius: "16px",
              padding: "16px 6px 14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              outline: "none",
              minHeight: "92px",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981",
              }}
            >
              <CreditCard size={20} />
            </div>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#FFFFFF", textAlign: "center", lineHeight: 1.2 }}>
              Collect<br />Rent
            </span>
          </button>

          {/* Quick Action 4: Add Expense */}
          <button
            onClick={() => navigate("/owner/expense-dashboard?action=add")}
            style={{
              background: "#111C2C",
              border: "1px solid #1E293B",
              borderRadius: "16px",
              padding: "16px 6px 14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              outline: "none",
              minHeight: "92px",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#F87171",
              }}
            >
              <Receipt size={20} />
            </div>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#FFFFFF", textAlign: "center", lineHeight: 1.2 }}>
              Add<br />Expense
            </span>
          </button>
        </div>
      </section>

      {/* 4. NEEDS ATTENTION */}
      <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#EF4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              <ArrowUp size={14} />
            </div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
              Needs attention
            </h2>
          </div>
          <button
            onClick={() => navigate("/payments?tab=pending")}
            style={{
              background: "transparent",
              border: "none",
              color: "#22C55E",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              padding: "4px",
            }}
          >
            View all &gt;
          </button>
        </div>

        <div
          style={{
            background: "#111C2C",
            border: "1px solid #1E293B",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          {/* Row 1: Pay today */}
          <div
            onClick={() => navigate("/payments")}
            role="button"
            tabIndex={0}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              cursor: "pointer",
              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              minHeight: "52px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  background: "rgba(245, 158, 11, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#F59E0B",
                  flexShrink: 0,
                }}
              >
                <Calendar size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#FFFFFF" }}>Pay today</div>
                <div style={{ fontSize: "12px", color: "#8E9BAE", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {attentionMetrics?.payTodayCount || 0} residents have rent due today
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginLeft: "8px" }}>
              <div style={{ textAlign: "right", minWidth: "48px" }}>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#F59E0B" }}>
                  {attentionMetrics?.payTodayCount || 0}
                </div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>residents</div>
              </div>
              <ChevronRight size={18} style={{ color: "#64748B", flexShrink: 0 }} />
            </div>
          </div>

          {/* Row 2: Overdue payments */}
          <div
            onClick={() => navigate("/payments?tab=pending")}
            role="button"
            tabIndex={0}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              cursor: "pointer",
              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              minHeight: "52px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  background: "rgba(239, 68, 68, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#EF4444",
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#FFFFFF" }}>Overdue payments</div>
                <div style={{ fontSize: "12px", color: "#8E9BAE", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {attentionMetrics?.overdueCount || 0} residents with overdue payments
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginLeft: "8px" }}>
              <div style={{ textAlign: "right", minWidth: "48px" }}>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#EF4444" }}>
                  {attentionMetrics?.overdueCount || 0}
                </div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>residents</div>
              </div>
              <ChevronRight size={18} style={{ color: "#64748B", flexShrink: 0 }} />
            </div>
          </div>

          {/* Row 3: Pending admissions */}
          <div
            onClick={() => navigate("/admissions")}
            role="button"
            tabIndex={0}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              cursor: "pointer",
              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              minHeight: "52px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  background: "rgba(59, 130, 246, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3B82F6",
                  flexShrink: 0,
                }}
              >
                <Users size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#FFFFFF" }}>Pending admissions</div>
                <div style={{ fontSize: "12px", color: "#8E9BAE", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {effectivePendingCount} new applications waiting for approval
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginLeft: "8px" }}>
              <div style={{ textAlign: "right", minWidth: "48px" }}>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#38BDF8" }}>
                  {effectivePendingCount}
                </div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>applications</div>
              </div>
              <ChevronRight size={18} style={{ color: "#64748B", flexShrink: 0 }} />
            </div>
          </div>

          {/* Row 4: Maintenance requests */}
          <div
            onClick={() => navigate("/owner/dashboard")}
            role="button"
            tabIndex={0}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              cursor: "pointer",
              minHeight: "52px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  background: "rgba(245, 158, 11, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#F59E0B",
                  flexShrink: 0,
                }}
              >
                <Wrench size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#FFFFFF" }}>Maintenance requests</div>
                <div style={{ fontSize: "12px", color: "#8E9BAE", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {attentionMetrics?.maintenanceCount || 0} open maintenance requests
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginLeft: "8px" }}>
              <div style={{ textAlign: "right", minWidth: "48px" }}>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#F59E0B" }}>
                  {attentionMetrics?.maintenanceCount || 0}
                </div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>open</div>
              </div>
              <ChevronRight size={18} style={{ color: "#64748B", flexShrink: 0 }} />
            </div>
          </div>
        </div>
      </section>

      {/* 5. OCCUPANCY CARD (Unified 2-Column Layout) */}
      <section
        onClick={() => navigate("/rooms")}
        role="button"
        tabIndex={0}
        style={{
          background: "#111C2C",
          border: "1px solid #1E293B",
          borderRadius: "16px",
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          cursor: "pointer",
        }}
      >
        {/* Left Side: Circular Ring + Occupancy stats + Progress Bar */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Emerald Ring Icon with Users */}
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border: "3px solid #22C55E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#22C55E",
                flexShrink: 0,
              }}
            >
              <Users size={20} />
            </div>

            <div>
              <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600 }}>Occupancy</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "28px", fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>
                  {occupancyRate}%
                </span>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                  <strong style={{ color: "#FFFFFF", fontWeight: 700 }}>{occupiedBeds}</strong> / {totalBeds} beds
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: "100%",
              height: "7px",
              borderRadius: "9999px",
              background: "#1E293B",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, occupancyRate))}%`,
                height: "100%",
                borderRadius: "9999px",
                background: "#22C55E",
                transition: "width 400ms ease",
              }}
            />
          </div>
        </div>

        {/* Right Side: 2 Stacked Mini Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "115px", flexShrink: 0 }}>
          {/* Mini Card 1: Occupied */}
          <div
            style={{
              background: "#162238",
              border: "1px solid #1E293B",
              borderRadius: "12px",
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <BedDouble size={18} style={{ color: "#94A3B8", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>
                {occupiedBeds}
              </div>
              <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "2px" }}>Occupied</div>
            </div>
          </div>

          {/* Mini Card 2: Available */}
          <div
            style={{
              background: "#162238",
              border: "1px solid #1E293B",
              borderRadius: "12px",
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <BedDouble size={18} style={{ color: "#94A3B8", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>
                {availableBeds}
              </div>
              <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "2px" }}>Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BELOW THE FOLD — SECONDARY MODULES (Collapsible Accordions)             */}
      {/* ========================================================================= */}
      <div style={{ height: "1px", background: colors.border.default || "#202B45", margin: "4px 0" }} />

      <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
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
              padding: "16px",
              background: "transparent",
              border: "none",
              color: "#FFFFFF",
              cursor: "pointer",
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Sparkles size={20} style={{ color: "#22C55E" }} />
              <span style={{ fontSize: "15px", fontWeight: 700 }}>AI Insights</span>
            </div>
            {openSections.ai ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {openSections.ai && (
            <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${colors.border.default || "#202B45"}` }}>
              <div style={{ paddingTop: "12px" }}>
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
              padding: "16px",
              background: "transparent",
              border: "none",
              color: "#FFFFFF",
              cursor: "pointer",
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Users size={20} style={{ color: "#94A3B8" }} />
              <span style={{ fontSize: "15px", fontWeight: 700 }}>Recent Activity</span>
            </div>
            {openSections.activity ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {openSections.activity && (
            <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${colors.border.default || "#202B45"}` }}>
              <div style={{ paddingTop: "12px" }}>
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
              padding: "16px",
              background: "transparent",
              border: "none",
              color: "#FFFFFF",
              cursor: "pointer",
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <HardDrive size={20} style={{ color: "#22C55E" }} />
              <span style={{ fontSize: "15px", fontWeight: 700 }}>Cloud Storage</span>
            </div>
            {openSections.storage ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {openSections.storage && (
            <div style={{ padding: "14px 16px 16px", borderTop: `1px solid ${colors.border.default || "#202B45"}`, display: "flex", flexDirection: "column", gap: "12px" }}>
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
                  minHeight: "44px",
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
                padding: "16px",
                background: "transparent",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
                minHeight: "48px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Building size={20} style={{ color: "#22C55E" }} />
                <span style={{ fontSize: "15px", fontWeight: 700 }}>Hostels in Workspace</span>
              </div>
              {openSections.hostels ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {openSections.hostels && (
              <div style={{ padding: "14px 16px 16px", borderTop: `1px solid ${colors.border.default || "#202B45"}`, display: "flex", flexDirection: "column", gap: "10px" }}>
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
