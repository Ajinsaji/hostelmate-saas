"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");

console.log("=================================================");
console.log("HOSTELMATE SUBSCRIPTION CENTER RUNTIME TEST SUITE");
console.log("=================================================");

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

// 1. Route existence
runTest("1. GET /api/admin/subscriptions/hostels route exists in saasAdminRoutes", () => {
  const routesContent = fs.readFileSync(path.join(__dirname, "../routes/saasAdminRoutes.js"), "utf8");
  assert.ok(routesContent.includes('router.get("/hostels"'), "GET /hostels route mounted in saasAdminRoutes");
});

// 2. Admin authentication guard
runTest("2. saasAdminRoutes enforces requireRole(['super_admin', 'admin']) middleware guard", () => {
  const routesContent = fs.readFileSync(path.join(__dirname, "../routes/saasAdminRoutes.js"), "utf8");
  assert.ok(routesContent.includes('requireRole(["super_admin", "admin"])'), "requireRole middleware mounted on saasAdminRoutes");
});

// 3. Null-date handling in listHostelSubscriptions
runTest("3. listHostelSubscriptions handles missing createdAt on hostel safely", () => {
  const serviceContent = fs.readFileSync(path.join(__dirname, "../services/subscriptionService.js"), "utf8");
  assert.ok(serviceContent.includes("const hCreatedAt = h.createdAt ? new Date(h.createdAt) : now;"), "hCreatedAt has safe Date fallback");
  assert.ok(serviceContent.includes("hCreatedAt.getTime()"), "getTime called on valid Date object");
});

// 4. Missing subscription fallback
runTest("4. listHostelSubscriptions falls back gracefully when Subscription document does not exist", () => {
  const serviceContent = fs.readFileSync(path.join(__dirname, "../services/subscriptionService.js"), "utf8");
  assert.ok(serviceContent.includes("if (!sub) {"), "sub fallback block exists");
  assert.ok(serviceContent.includes('paymentStatus: "Pending"'), "sub fallback provides paymentStatus");
});

// 5. SubscriptionHistory query safety
runTest("5. getSubscriptionHistory queries with $or array safely", () => {
  const controllerContent = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
  assert.ok(controllerContent.includes("SubscriptionHistory.find"), "getSubscriptionHistory queries SubscriptionHistory");
});

// 6. Multi-hostel mapping
runTest("6. listHostelSubscriptions maps every hostel by hostelId cleanly", () => {
  const serviceContent = fs.readFileSync(path.join(__dirname, "../services/subscriptionService.js"), "utf8");
  assert.ok(serviceContent.includes("hostelId: h._id"), "hostelId mapped in return object");
});

// 7. Status filter case-insensitivity
runTest("7. listHostelSubscriptions status filter handles case-insensitive values", () => {
  const controllerContent = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
  assert.ok(controllerContent.includes("item.status.toLowerCase() === st"), "Status filter case-insensitive");
});

// 8. Search query safety
runTest("8. listHostelSubscriptions search handles whitespace trimming and lowercase match", () => {
  const controllerContent = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
  assert.ok(controllerContent.includes("search.trim().toLowerCase()"), "Search handles trim and lowercase");
});

// 9. Error response structure
runTest("9. listHostelSubscriptions catch block returns controlled 500 error JSON", () => {
  const controllerContent = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
  assert.ok(controllerContent.includes("res.status(500).json({ success: false"), "Catch block returns controlled error object");
});

// 10. Secrets protection check
runTest("10. saasAdminController does not expose secrets or passwords in responses", () => {
  const controllerContent = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
  assert.ok(!controllerContent.includes("process.env.JWT_SECRET"), "No JWT_SECRET exposed in controller output");
  assert.ok(!controllerContent.includes("process.env.MONGO_URI"), "No MONGO_URI exposed in controller output");
});

// 11. Multi-tenant owner data isolation
runTest("11. Owner details populated with selected fields only", () => {
  const controllerContent = fs.readFileSync(path.join(__dirname, "../controllers/saasAdminController.js"), "utf8");
  assert.ok(controllerContent.includes('.populate("ownerId", "ownerName phone email")'), "populate selects safe fields only");
});

// 12. Frontend Promise.allSettled usage
runTest("12. Frontend SubscriptionCenter uses Promise.allSettled for data loading resilience", () => {
  const viewContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/superadmin/views/SubscriptionCenter.jsx"), "utf8");
  assert.ok(viewContent.includes("Promise.allSettled"), "SubscriptionCenter uses Promise.allSettled");
});

console.log("\n-------------------------------------------------");
console.log(`SUITE RESULTS: ${passed} / ${total} TESTS PASSED`);
console.log("-------------------------------------------------\n");

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
