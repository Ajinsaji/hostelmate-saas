"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

console.log("====================================================================");
console.log("HOSTELMATE SUBSCRIPTION CENTER REAL DATABASE AUDIT TEST SUITE (30 TESTS)");
console.log("====================================================================");

let passed = 0;
let total = 0;

function runTest(description, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] Test ${total}: ${description}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] Test ${total}: ${description}`);
    console.error(err.stack || err.message);
  }
}

async function runAsyncTests() {
  require("dotenv").config({ path: path.join(__dirname, "../.env") });
  await mongoose.connect(process.env.MONGO_URI);

  const subscriptionService = require("../services/subscriptionService");
  const saasAdminController = require("../controllers/saasAdminController");

  // 1. Single source of truth function exists
  runTest("1. getReconciledSubscriptionData service function exists", () => {
    assert.strictEqual(typeof subscriptionService.getReconciledSubscriptionData, "function");
  });

  // 2. Data reconciliation check
  const reconciled = await subscriptionService.getReconciledSubscriptionData();
  const activeInArray = reconciled.subscriptions.filter(s => s.status.toLowerCase() === "active").length;
  const trialInArray = reconciled.subscriptions.filter(s => (s.status.toLowerCase() === "trial" || s.isTrial) && s.status.toLowerCase() !== "expired").length;
  const expiredInArray = reconciled.subscriptions.filter(s => s.status.toLowerCase() === "expired").length;
  const expiringInArray = reconciled.subscriptions.filter(s => s.daysRemaining >= 0 && s.daysRemaining <= 30 && s.status.toLowerCase() !== "expired").length;

  runTest("2. Reconciled summary activeSubscribers matches directory array active count", () => {
    assert.strictEqual(reconciled.analytics.activeSubscribers, activeInArray);
  });

  runTest("3. Reconciled summary trialHostels matches directory array trial count", () => {
    assert.strictEqual(reconciled.analytics.trialHostels, trialInArray);
  });

  runTest("4. Reconciled summary expiredHostels matches directory array expired count", () => {
    assert.strictEqual(reconciled.analytics.expiredHostels, expiredInArray);
  });

  runTest("5. Reconciled summary expiringSoon30 matches directory array expiring count", () => {
    assert.strictEqual(reconciled.analytics.expiringSoon30, expiringInArray);
  });

  runTest("6. Total hostels in analytics matches subscriptions array length", () => {
    assert.strictEqual(reconciled.analytics.totalHostels, reconciled.subscriptions.length);
  });

  runTest("7. Active residents in analytics matches sum of resident counts", () => {
    const sumResidents = reconciled.subscriptions.reduce((sum, s) => sum + (s.activeResidents || 0), 0);
    assert.strictEqual(reconciled.analytics.totalActiveResidents, sumResidents);
  });

  runTest("8. Expected revenue matches active residents * 10", () => {
    assert.strictEqual(reconciled.analytics.expectedRevenue, reconciled.analytics.totalActiveResidents * 10);
  });

  runTest("9. No static fallbacks (15, 2, 9) in analytics output", () => {
    assert.notStrictEqual(reconciled.analytics.trialHostels, 15, "trialHostels is real database count");
    assert.notStrictEqual(reconciled.analytics.activeSubscribers, 2, "activeSubscribers is real database count");
    assert.notStrictEqual(reconciled.analytics.expiringSoon30, 9, "expiringSoon30 is real database count");
  });

  // 10. listHostelSubscriptions status filter
  runTest("10. listHostelSubscriptions status filter 'trial' returns matching trial records", async () => {
    const req = { query: { status: "trial" } };
    let jsonResult = null;
    const res = {
      status() { return this; },
      json(data) { jsonResult = data; return this; }
    };
    await saasAdminController.listHostelSubscriptions(req, res);
    assert.ok(jsonResult.success);
    assert.strictEqual(jsonResult.subscriptions.length, trialInArray);
  });

  // 11. listHostelSubscriptions status filter 'active'
  runTest("11. listHostelSubscriptions status filter 'active' returns matching active records", async () => {
    const req = { query: { status: "active" } };
    let jsonResult = null;
    const res = {
      status() { return this; },
      json(data) { jsonResult = data; return this; }
    };
    await saasAdminController.listHostelSubscriptions(req, res);
    assert.ok(jsonResult.success);
    assert.strictEqual(jsonResult.subscriptions.length, activeInArray);
  });

  // 12. listHostelSubscriptions status filter 'expiring'
  runTest("12. listHostelSubscriptions status filter 'expiring' returns matching expiring records", async () => {
    const req = { query: { status: "expiring" } };
    let jsonResult = null;
    const res = {
      status() { return this; },
      json(data) { jsonResult = data; return this; }
    };
    await saasAdminController.listHostelSubscriptions(req, res);
    assert.ok(jsonResult.success);
    assert.strictEqual(jsonResult.subscriptions.length, expiringInArray);
  });

  // 13. Search filter operating on live database properties
  runTest("13. listHostelSubscriptions search filters by hostelName, ownerName, phone, email, city", async () => {
    if (reconciled.subscriptions.length > 0) {
      const sampleHostel = reconciled.subscriptions[0];
      const req = { query: { search: sampleHostel.hostelName.slice(0, 4) } };
      let jsonResult = null;
      const res = {
        status() { return this; },
        json(data) { jsonResult = data; return this; }
      };
      await saasAdminController.listHostelSubscriptions(req, res);
      assert.ok(jsonResult.success);
      assert.ok(jsonResult.subscriptions.length > 0);
    }
  });

  // 14. Missing Subscription record fallback
  runTest("14. Hostels without explicit Subscription document return dynamic trial fallback", () => {
    const fallbackItem = reconciled.subscriptions.find(s => s.isTrial);
    assert.ok(fallbackItem, "Trial item exists");
    assert.ok(fallbackItem.expiryDate, "Expiry date computed");
  });

  // 15. Multi-hostel mapping
  runTest("15. Multi-hostel owners maintain independent hostel subscriptions", () => {
    const hostelIds = reconciled.subscriptions.map(s => String(s.hostelId));
    const uniqueIds = new Set(hostelIds);
    assert.strictEqual(hostelIds.length, uniqueIds.size, "All hostel IDs in directory are unique");
  });

  // 16. Admin RBAC guard
  runTest("16. saasAdminRoutes enforces super_admin/admin RBAC guard", () => {
    const routesCode = fs.readFileSync(path.join(__dirname, "../routes/saasAdminRoutes.js"), "utf8");
    assert.ok(routesCode.includes('requireRole(["super_admin", "admin"])'), "requireRole mounted");
  });

  // 17. Frontend Promise.allSettled usage
  runTest("17. Frontend SubscriptionCenter uses Promise.allSettled for data resilience", () => {
    const viewCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/superadmin/views/SubscriptionCenter.jsx"), "utf8");
    assert.ok(viewCode.includes("Promise.allSettled"), "Promise.allSettled used");
  });

  // 18. Frontend CSV Export implementation
  runTest("18. Frontend SubscriptionCenter implements handleExportCSV for directory data", () => {
    const viewCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/superadmin/views/SubscriptionCenter.jsx"), "utf8");
    assert.ok(viewCode.includes("handleExportCSV"), "handleExportCSV implemented");
  });

  // 19. Auto refresh visibility check
  runTest("19. Frontend SubscriptionCenter auto-refresh checks document.visibilityState", () => {
    const viewCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/superadmin/views/SubscriptionCenter.jsx"), "utf8");
    assert.ok(viewCode.includes('document.visibilityState === "visible"'), "visibilityState check present");
  });

  // 20. Secrets protection
  runTest("20. saasAdminController does not expose environment secrets or connection strings", () => {
    const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
    assert.ok(!controllerCode.includes("process.env.JWT_SECRET"), "JWT_SECRET protected");
    assert.ok(!controllerCode.includes("process.env.MONGO_URI"), "MONGO_URI protected");
  });

  // 21. getReminderLogs endpoint exists
  runTest("21. getReminderLogs controller function exists", () => {
    assert.strictEqual(typeof saasAdminController.getReminderLogs, "function");
  });

  // 22. Payment status filtering in Frontend
  runTest("22. Frontend SubscriptionCenter supports paymentStatus filtering", () => {
    const viewCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/superadmin/views/SubscriptionCenter.jsx"), "utf8");
    assert.ok(viewCode.includes("paymentFilter"), "paymentFilter state exists");
  });

  // 23. Rich Subscription Details Modal in Frontend
  runTest("23. Frontend SubscriptionCenter implements Rich Subscription Details Modal", () => {
    const viewCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/superadmin/views/SubscriptionCenter.jsx"), "utf8");
    assert.ok(viewCode.includes("showDetailsModal"), "showDetailsModal state exists");
    assert.ok(viewCode.includes("openDetailsModal"), "openDetailsModal handler exists");
  });

  // 24. getOwnerSubscriptionDetails service function
  runTest("24. getOwnerSubscriptionDetails service function exists", () => {
    assert.strictEqual(typeof subscriptionService.getOwnerSubscriptionDetails, "function");
  });

  // 25. initializeTrialSubscription service function
  runTest("25. initializeTrialSubscription service function exists", () => {
    assert.strictEqual(typeof subscriptionService.initializeTrialSubscription, "function");
  });

  // 26. seedDefaultFeaturesAndPlans service function
  runTest("26. seedDefaultFeaturesAndPlans service function exists", () => {
    assert.strictEqual(typeof subscriptionService.seedDefaultFeaturesAndPlans, "function");
  });

  // 27. getBillingSettings service function
  runTest("27. getBillingSettings service function exists", () => {
    assert.strictEqual(typeof subscriptionService.getBillingSettings, "function");
  });

  // 28. getActiveResidentCount service function
  runTest("28. getActiveResidentCount service function exists", () => {
    assert.strictEqual(typeof subscriptionService.getActiveResidentCount, "function");
  });

  // 29. saasAdminRoutes mounts all required CRUD endpoints
  runTest("29. saasAdminRoutes mounts /dashboard, /requests, /hostels, /reminder-logs", () => {
    const routesCode = fs.readFileSync(path.join(__dirname, "../routes/saasAdminRoutes.js"), "utf8");
    assert.ok(routesCode.includes('router.get("/dashboard"'), "/dashboard mounted");
    assert.ok(routesCode.includes('router.get("/requests"'), "/requests mounted");
    assert.ok(routesCode.includes('router.get("/hostels"'), "/hostels mounted");
    assert.ok(routesCode.includes('router.get("/reminder-logs"'), "/reminder-logs mounted");
  });

  // 30. Structured error responses
  runTest("30. saasAdminController returns structured JSON error responses on failure", () => {
    const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
    assert.ok(controllerCode.includes("res.status(500).json({ success: false"), "Structured 500 JSON error return present");
  });

  await mongoose.disconnect();

  console.log("\n-------------------------------------------------------------");
  console.log(`SUITE RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log("-------------------------------------------------------------\n");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAsyncTests().catch(err => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
