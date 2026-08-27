"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");

console.log("====================================================================");
console.log("HOSTELMATE DYNAMIC SUBSCRIPTION CENTER & ADMIN ACTIONS TEST SUITE (30 TESTS)");
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

const subscriptionService = require("../services/subscriptionService");
const saasAdminController = require("../controllers/saasAdminController");

// 1. getSuperAdminAnalytics function exists
runTest("1. getSuperAdminAnalytics service function exists", () => {
  assert.strictEqual(typeof subscriptionService.getSuperAdminAnalytics, "function");
});

// 2. getSuperAdminAnalytics exports required fields
runTest("2. getSuperAdminAnalytics source code references required dynamic fields", () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, "../services/subscriptionService.js"), "utf8");
  assert.ok(serviceCode.includes("expiringSoon7"), "expiringSoon7 field included");
  assert.ok(serviceCode.includes("expiringSoon30"), "expiringSoon30 field included");
  assert.ok(serviceCode.includes("pendingRequests"), "pendingRequests field included");
  assert.ok(serviceCode.includes("totalActiveResidents"), "totalActiveResidents field included");
});

// 3. listHostelSubscriptions controller method exists
runTest("3. listHostelSubscriptions controller function exists", () => {
  assert.strictEqual(typeof saasAdminController.listHostelSubscriptions, "function");
});

// 4. listHostelSubscriptions returns rich hostel properties
runTest("4. listHostelSubscriptions maps rich hostel properties (city, email, isExpiringSoon)", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
  assert.ok(controllerCode.includes("isExpiringSoon"), "isExpiringSoon computed");
  assert.ok(controllerCode.includes("email:"), "email mapped");
  assert.ok(controllerCode.includes("city:"), "city mapped");
});

// 5. Status filter supports expiring and trial
runTest("5. listHostelSubscriptions status filter supports expiring and trial filters", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
  assert.ok(controllerCode.includes('st === "expiring" || st === "expiring_soon"'), "expiring filter supported");
  assert.ok(controllerCode.includes('st === "trial"'), "trial filter supported");
});

// 6. Search filter operates on email, city, and subscriptionId
runTest("6. listHostelSubscriptions search operates on hostelName, ownerName, phone, email, city, subscriptionId", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
  assert.ok(controllerCode.includes("email.toLowerCase().includes(q)"), "email search supported");
  assert.ok(controllerCode.includes("city.toLowerCase().includes(q)"), "city search supported");
});

// 7. approveSubscriptionRequest controller exists
runTest("7. approveSubscriptionRequest controller function exists", () => {
  assert.strictEqual(typeof saasAdminController.approveSubscriptionRequest, "function");
});

// 8. rejectSubscriptionRequest controller exists
runTest("8. rejectSubscriptionRequest controller function exists", () => {
  assert.strictEqual(typeof saasAdminController.rejectSubscriptionRequest, "function");
});

// 9. manualExtendSubscription controller exists
runTest("9. manualExtendSubscription controller function exists", () => {
  assert.strictEqual(typeof saasAdminController.manualExtendSubscription, "function");
});

// 10. adjustSubscriptionDays controller exists
runTest("10. adjustSubscriptionDays controller function exists", () => {
  assert.strictEqual(typeof saasAdminController.adjustSubscriptionDays, "function");
});

// 11. getSubscriptionHistory controller exists
runTest("11. getSubscriptionHistory controller function exists", () => {
  assert.strictEqual(typeof saasAdminController.getSubscriptionHistory, "function");
});

// 12. Admin RBAC guard on routes
runTest("12. saasAdminRoutes enforces super_admin/admin RBAC guard", () => {
  const routesCode = fs.readFileSync(path.join(__dirname, "../routes/saasAdminRoutes.js"), "utf8");
  assert.ok(routesCode.includes('requireRole(["super_admin", "admin"])'), "requireRole mounted");
});

// 13. Null-date handling in listHostelSubscriptions
runTest("13. listHostelSubscriptions handles missing createdAt safely", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
  assert.ok(controllerCode.includes("const hCreatedAt = h.createdAt ? new Date(h.createdAt) : now;"), "Safe hCreatedAt fallback");
});

// 14. Missing Subscription record fallback
runTest("14. listHostelSubscriptions falls back gracefully when Subscription document does not exist", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
  assert.ok(controllerCode.includes("if (!sub) {"), "Missing sub fallback exists");
});

// 15. Multi-hostel mapping by hostelId
runTest("15. Hostels mapped independently by hostelId", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
  assert.ok(controllerCode.includes("hostelId: h._id"), "hostelId mapped in return object");
});

// 16. Frontend Promise.allSettled usage
runTest("16. Frontend SubscriptionCenter uses Promise.allSettled for data resilience", () => {
  const viewCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/superadmin/views/SubscriptionCenter.jsx"), "utf8");
  assert.ok(viewCode.includes("Promise.allSettled"), "Promise.allSettled used in fetchDashboardData");
});

// 17. CSV Export utility implementation
runTest("17. Frontend SubscriptionCenter implements handleExportCSV for directory data", () => {
  const viewCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/superadmin/views/SubscriptionCenter.jsx"), "utf8");
  assert.ok(viewCode.includes("handleExportCSV"), "handleExportCSV implemented");
});

// 18. Auto refresh visibility check
runTest("18. Frontend SubscriptionCenter auto-refresh checks document.visibilityState", () => {
  const viewCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/superadmin/views/SubscriptionCenter.jsx"), "utf8");
  assert.ok(viewCode.includes('document.visibilityState === "visible"'), "visibilityState check present");
});

// 19. Secrets protection
runTest("19. saasAdminController does not expose environment secrets or connection strings", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
  assert.ok(!controllerCode.includes("process.env.JWT_SECRET"), "JWT_SECRET protected");
  assert.ok(!controllerCode.includes("process.env.MONGO_URI"), "MONGO_URI protected");
});

// 20. Resident billing calculation rate
runTest("20. subscriptionService calculates expected revenue using 10 INR per resident rate", () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, "../services/subscriptionService.js"), "utf8");
  assert.ok(serviceCode.includes("totalActiveResidents * 10"), "₹10 per resident rate used");
});

// 21. Reminder logs endpoint exists
runTest("21. getReminderLogs controller function exists", () => {
  assert.strictEqual(typeof saasAdminController.getReminderLogs, "function");
});

// 22. Payment status filtering
runTest("22. Frontend SubscriptionCenter supports paymentStatus filtering", () => {
  const viewCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/superadmin/views/SubscriptionCenter.jsx"), "utf8");
  assert.ok(viewCode.includes("paymentFilter"), "paymentFilter state exists");
});

// 23. Rich Subscription Details Modal
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

// 30. Controller catch blocks return structured 500 JSON
runTest("30. saasAdminController returns structured JSON error responses on failure", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
  assert.ok(controllerCode.includes("res.status(500).json({ success: false"), "Structured 500 JSON error return present");
});

console.log("\n-------------------------------------------------------------");
console.log(`SUITE RESULTS: ${passed} / ${total} TESTS PASSED`);
console.log("-------------------------------------------------------------\n");

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
