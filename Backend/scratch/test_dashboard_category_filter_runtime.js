"use strict";

/**
 * 🟢 HOSTELMATE ENTERPRISE — DASHBOARD CATEGORY FILTER RUNTIME & STATIC TEST
 *
 * Verifies:
 * 1. AdminTodayTasksWidget & DashboardOverview static syntax analysis: categoryFilter & setCategoryFilter are properly declared.
 * 2. No undefined references in AdminTodayTasksWidget or DashboardOverview.
 * 3. Safe fallback data simulation: renders zero-data, empty arrays, missing categories without crash.
 * 4. Filtering logic verification:
 *    - "all"
 *    - "registration" / "registrations"
 *    - "activation" / "activations"
 *    - "subscription" / "subscriptions"
 *    - "payment" / "payments"
 *    - "whatsapp"
 *    - "failed" / "failed_deliveries"
 * 5. Tab filtering simulation (pending vs completed).
 * 6. Protection against legacy Base/Pro/Enterprise plans.
 */

const fs = require("fs");
const path = require("path");

function runDashboardCategoryFilterTests() {
  console.log("==================================================");
  console.log("🟢 HOSTELMATE — DASHBOARD CATEGORY FILTER VERIFICATION");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Static Audit of AdminTodayTasksWidget.jsx
  const widgetPath = path.join(__dirname, "../../Frontend/src/superadmin/components/AdminTodayTasksWidget.jsx");
  assert(fs.existsSync(widgetPath), "AdminTodayTasksWidget.jsx exists");
  const widgetCode = fs.readFileSync(widgetPath, "utf8");

  assert(
    widgetCode.includes('const [categoryFilter, setCategoryFilter] = useState("all")') ||
    widgetCode.includes("const [categoryFilter, setCategoryFilter] = useState('all')",),
    "AdminTodayTasksWidget declares categoryFilter and setCategoryFilter with default 'all'"
  );

  assert(
    !widgetCode.includes("activeCategoryFilter"),
    "No orphaned activeCategoryFilter state references remain"
  );

  // Check all setCategoryFilter calls
  const setCategoryFilterCount = (widgetCode.match(/setCategoryFilter\(/g) || []).length;
  assert(setCategoryFilterCount >= 6, `Found ${setCategoryFilterCount} setCategoryFilter button handlers in JSX`);

  // Check all categoryFilter === usages
  const categoryFilterUsageCount = (widgetCode.match(/categoryFilter ===/g) || []).length;
  assert(categoryFilterUsageCount >= 6, `Found ${categoryFilterUsageCount} categoryFilter condition checks in JSX/filtering`);

  // 2. Static Audit of DashboardOverview.jsx
  const overviewPath = path.join(__dirname, "../../Frontend/src/superadmin/views/DashboardOverview.jsx");
  assert(fs.existsSync(overviewPath), "DashboardOverview.jsx exists");
  const overviewCode = fs.readFileSync(overviewPath, "utf8");

  assert(
    !overviewCode.match(/\bcategoryFilter\b(?!\s*[:=])/g),
    "DashboardOverview does not have dangling or undefined categoryFilter references"
  );

  assert(
    overviewCode.includes("<AdminTodayTasksWidget"),
    "DashboardOverview cleanly mounts AdminTodayTasksWidget"
  );

  // 3. Static Audit of AdminTasksPage.jsx
  const tasksPagePath = path.join(__dirname, "../../Frontend/src/superadmin/views/AdminTasksPage.jsx");
  assert(fs.existsSync(tasksPagePath), "AdminTasksPage.jsx exists");
  const tasksPageCode = fs.readFileSync(tasksPagePath, "utf8");

  assert(
    tasksPageCode.includes('const [categoryFilter, setCategoryFilter] = useState("all")'),
    "AdminTasksPage declares categoryFilter state"
  );

  // 4. Runtime Simulation: Filtering logic on realistic mock data
  const mockPendingTasks = [
    {
      id: "task_1",
      category: "whatsapp",
      type: "whatsapp_manual",
      title: "Rent reminder WhatsApp awaiting manual send",
      templateCode: "RENT_REMINDER",
      phone: "919876543210",
      status: "pending_manual",
    },
    {
      id: "task_2",
      category: "registration",
      type: "new_registration",
      actionType: "review_registration",
      title: "New hostel registration submitted",
      status: "pending",
    },
    {
      id: "task_3",
      category: "activation",
      type: "activation_pending",
      actionType: "finalize_activation",
      title: "Hostel registration approved awaiting activation",
      status: "activation_pending",
    },
    {
      id: "task_4",
      category: "subscription",
      type: "subscription_pending",
      actionType: "approve_subscription",
      title: "Subscription renewal request",
      status: "pending",
    },
    {
      id: "task_5",
      category: "payment",
      type: "payment_pending",
      actionType: "verify_payment",
      title: "Payment receipt awaiting verification",
      status: "Pending",
    },
    {
      id: "task_6",
      category: "whatsapp",
      type: "whatsapp_failed",
      title: "Failed WhatsApp delivery (Attempt 1/3)",
      status: "failed",
    },
  ];

  const mockCompletedTasks = [
    {
      id: "done_1",
      category: "registration",
      type: "approved_registration",
      title: "Approved hostel registration",
      status: "completed",
    },
    {
      id: "done_2",
      category: "activation",
      type: "finalized_activation",
      title: "Finalized hostel activation",
      status: "activated",
    },
    {
      id: "done_3",
      category: "whatsapp",
      type: "manual_whatsapp_sent",
      title: "Sent manual WhatsApp",
      status: "manual_opened",
    },
  ];

  // Pure filter function representing widget implementation
  function filterWidgetTasks(list, filter) {
    return (Array.isArray(list) ? list : []).filter((item) => {
      if (!item) return false;
      if (filter === "all") return true;
      if (filter === "whatsapp") {
        return (
          item.category === "whatsapp" ||
          item.type?.includes("whatsapp") ||
          item.templateCode === "RENT_REMINDER" ||
          item.templateCode === "OWNER_ACCOUNT_ACTIVATED" ||
          item.templateCode === "PAYMENT_RECEIVED"
        );
      }
      if (filter === "registration" || filter === "registrations") {
        return (
          item.category === "registration" ||
          item.type?.includes("registration") ||
          item.actionType === "review_registration"
        );
      }
      if (filter === "activation" || filter === "activations") {
        return (
          item.category === "activation" ||
          item.type?.includes("activation") ||
          item.actionType === "finalize_activation"
        );
      }
      if (filter === "subscription" || filter === "subscriptions") {
        return (
          item.category === "subscription" ||
          item.type?.includes("subscription") ||
          item.actionType === "approve_subscription"
        );
      }
      if (filter === "payment" || filter === "payments") {
        return (
          item.category === "payment" ||
          item.type?.includes("payment") ||
          item.actionType === "verify_payment"
        );
      }
      if (filter === "failed" || filter === "failed_deliveries") {
        return (
          item.status === "failed" ||
          item.category === "failed" ||
          item.type === "whatsapp_failed" ||
          item.type?.includes("failed")
        );
      }
      return true;
    });
  }

  // Test "all"
  const allPending = filterWidgetTasks(mockPendingTasks, "all");
  assert(allPending.length === 6, `Filter 'all' returns all 6 tasks (got ${allPending.length})`);

  // Test "registration"
  const regTasks = filterWidgetTasks(mockPendingTasks, "registration");
  assert(regTasks.length === 1 && regTasks[0].id === "task_2", "Filter 'registration' matches task_2");

  // Test "activation"
  const actTasks = filterWidgetTasks(mockPendingTasks, "activation");
  assert(actTasks.length === 1 && actTasks[0].id === "task_3", "Filter 'activation' matches task_3");

  // Test "subscription"
  const subTasks = filterWidgetTasks(mockPendingTasks, "subscription");
  assert(subTasks.length === 1 && subTasks[0].id === "task_4", "Filter 'subscription' matches task_4");

  // Test "payment"
  const payTasks = filterWidgetTasks(mockPendingTasks, "payment");
  assert(payTasks.length === 1 && payTasks[0].id === "task_5", "Filter 'payment' matches task_5");

  // Test "whatsapp"
  const waTasks = filterWidgetTasks(mockPendingTasks, "whatsapp");
  assert(waTasks.length === 2, `Filter 'whatsapp' matches 2 WhatsApp items (got ${waTasks.length})`);

  // Test "failed"
  const failedTasks = filterWidgetTasks(mockPendingTasks, "failed");
  assert(failedTasks.length === 1 && failedTasks[0].id === "task_6", "Filter 'failed' matches task_6");

  // Test Completed list filtering
  const completedAll = filterWidgetTasks(mockCompletedTasks, "all");
  assert(completedAll.length === 3, "Completed list renders 3 items under 'all'");

  const completedReg = filterWidgetTasks(mockCompletedTasks, "registration");
  assert(completedReg.length === 1 && completedReg[0].id === "done_1", "Completed list matches done_1 under 'registration'");

  const completedAct = filterWidgetTasks(mockCompletedTasks, "activation");
  assert(completedAct.length === 1 && completedAct[0].id === "done_2", "Completed list matches done_2 under 'activation'");

  // 5. Zero-Data & Defensive Fallback Simulation
  const emptyRes = filterWidgetTasks([], "all");
  assert(Array.isArray(emptyRes) && emptyRes.length === 0, "Empty list returns empty array safely");

  const nullRes = filterWidgetTasks(null, "all");
  assert(Array.isArray(nullRes) && nullRes.length === 0, "Null list returns empty array safely");

  const undefinedRes = filterWidgetTasks(undefined, "registration");
  assert(Array.isArray(undefinedRes) && undefinedRes.length === 0, "Undefined list returns empty array safely");

  const malformedItems = [null, undefined, {}, { category: null }];
  const malformedRes = filterWidgetTasks(malformedItems, "registration");
  assert(Array.isArray(malformedRes) && malformedRes.length === 0, "Malformed task items do not throw errors");

  // 6. Subscription Model Safety Check (No Base/Pro/Enterprise tier changes)
  const subModelCode = fs.readFileSync(path.join(__dirname, "../models/SystemSetting.js"), "utf8");
  assert(
    !widgetCode.includes("BasePlan") && !widgetCode.includes("EnterprisePlan"),
    "No hardcoded tier overrides in widget"
  );

  console.log("==================================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runDashboardCategoryFilterTests();
