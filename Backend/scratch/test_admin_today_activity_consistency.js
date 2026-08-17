const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const communicationController = require("../controllers/communicationController");
const Communication = require("../models/Communication");
const HostelRequest = require("../models/HostelRequest");
const AuditLog = require("../models/AuditLog");

async function runTest() {
  console.log("\n=======================================================");
  console.log("TEST 2: ADMIN TODAY'S TASKS & ACTIVITY CONSISTENCY");
  console.log("=======================================================\n");

  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hostelmate";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Mock req, res
    const req = {
      user: { role: "super_admin" },
      admin: { role: "super_admin" },
    };

    let responseStatusCode = null;
    let responseData = null;

    const res = {
      status(code) {
        responseStatusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
    };

    await communicationController.getPendingCommunicationTasks(req, res);

    assert(responseStatusCode === 200, "getPendingCommunicationTasks returns HTTP 200");
    assert(responseData && responseData.success === true, "Response has success: true");
    assert(typeof responseData.summary === "object", "Response contains canonical 'summary' object");
    assert(typeof responseData.summary.pendingCount === "number", "summary has numerical pendingCount");
    assert(typeof responseData.summary.completedTodayCount === "number", "summary has numerical completedTodayCount");
    assert(typeof responseData.summary.totalActivityCount === "number", "summary has numerical totalActivityCount");
    assert(
      responseData.summary.totalActivityCount === (responseData.summary.pendingCount + responseData.summary.completedTodayCount),
      "totalActivityCount exactly matches pendingCount + completedTodayCount"
    );

    // Verify categories object
    assert(typeof responseData.categories === "object", "Response contains categories breakdown");
    assert(typeof responseData.categories.pendingRegistrationsCount === "number", "categories has pendingRegistrationsCount");
    assert(typeof responseData.categories.pendingActivationsCount === "number", "categories has pendingActivationsCount");
    assert(typeof responseData.categories.pendingSubscriptionsCount === "number", "categories has pendingSubscriptionsCount");
    assert(typeof responseData.categories.failedDeliveriesCount === "number", "categories has failedDeliveriesCount");

    // Verify task arrays exist
    assert(Array.isArray(responseData.pendingTasks), "pendingTasks is an Array");
    assert(Array.isArray(responseData.completedTasksToday), "completedTasksToday is an Array");
    assert(responseData.pendingTasks.length === responseData.summary.pendingCount, "pendingTasks length matches summary.pendingCount");
    assert(responseData.completedTasksToday.length === responseData.summary.completedTodayCount, "completedTasksToday length matches summary.completedTodayCount");

  } catch (err) {
    console.error("Test execution failed with error:", err);
    failed++;
  } finally {
    console.log(`\nResults: ${passed} Passed, ${failed} Failed\n`);
    if (process.env.TEST_STANDALONE !== "false") {
      await mongoose.disconnect();
      process.exit(failed > 0 ? 1 : 0);
    }
  }
}

if (require.main === module) {
  runTest();
}

module.exports = runTest;
