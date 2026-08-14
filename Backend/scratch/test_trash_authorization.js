/**
 * Test: test_trash_authorization.js
 * Validates elevated administrator authorization, exact confirmation string check,
 * and financial record protection for permanent trash purge.
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Hostel = require("../models/Hostel");
const Payment = require("../models/Payment");
const Subscription = require("../models/Subscription");
const { permanentDeleteHostelFromTrash } = require("../controllers/adminController");

async function runTrashAuthTests() {
  console.log("\n========================================================");
  console.log("  TRASH / PERMANENT PURGE — AUTHORIZATION & SAFETY TESTS");
  console.log("========================================================\n");

  const uri = process.env.MONGO_URI || process.env.DATABASE_URL;
  await mongoose.connect(uri);

  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${msg}`);
      failed++;
    }
  }

  function createMockRes() {
    return {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
  }

  try {
    const timestamp = Date.now();
    const hostelName = `Trash_Target_Hostel_${timestamp}`;

    // Create a soft-deleted hostel in Trash
    const trashHostel = await Hostel.create({
      hostelName: hostelName,
      phone: `9333${Math.floor(100000 + Math.random() * 900000)}`,
      isDeleted: true,
      deletedAt: new Date(),
    });

    // Create associated payment and subscription records
    const testPayment = await Payment.create({
      hostelId: trashHostel._id,
      amount: 15000,
      paidAmount: 15000,
      status: "Paid",
    });

    const testSub = await Subscription.create({
      hostelId: trashHostel._id,
      planType: "Pro",
      subscriptionStatus: "expired",
    });

    // TEST 1: Unauthorized role (e.g. resident or owner) gets 403 Forbidden
    const mockResUnauthorized = createMockRes();
    await permanentDeleteHostelFromTrash(
      {
        params: { id: trashHostel._id.toString() },
        body: { confirmHostelName: hostelName },
        user: { role: "owner" }
      },
      mockResUnauthorized
    );
    assert(mockResUnauthorized.statusCode === 403, "Non-admin role (owner) is rejected with HTTP 403 Forbidden");

    // TEST 2: Wrong confirmation name gets 400 Bad Request
    const mockResWrongName = createMockRes();
    await permanentDeleteHostelFromTrash(
      {
        params: { id: trashHostel._id.toString() },
        body: { confirmHostelName: "Wrong Name" },
        user: { role: "super_admin" }
      },
      mockResWrongName
    );
    assert(mockResWrongName.statusCode === 400, "Mismatched confirmation string is rejected with HTTP 400");

    // TEST 3: Authorized SuperAdmin with exact confirmation name permanently purges hostel document
    const mockResSuccess = createMockRes();
    await permanentDeleteHostelFromTrash(
      {
        params: { id: trashHostel._id.toString() },
        body: { confirmHostelName: hostelName },
        user: { role: "super_admin" }
      },
      mockResSuccess
    );
    assert(mockResSuccess.statusCode === 200 && mockResSuccess.body.success, "Authorized SuperAdmin permanently purges hostel (HTTP 200)");

    // Verify hostel document is deleted
    const checkHostel = await Hostel.findById(trashHostel._id);
    assert(!checkHostel, "Hostel document successfully purged from database");

    // Verify payment and subscription records remain preserved
    const checkPayment = await Payment.findById(testPayment._id);
    const checkSub = await Subscription.findById(testSub._id);
    assert(checkPayment && checkPayment.paidAmount === 15000, "Historical payment financial ledger remains preserved and untouched");
    assert(checkSub && checkSub.planType === "Pro", "Historical subscription record remains preserved");

    // Clean up test records
    await Payment.findByIdAndDelete(testPayment._id);
    await Subscription.findByIdAndDelete(testSub._id);

  } catch (err) {
    console.error("Trash authorization test error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log("\n========================================================");
    console.log(`TRASH AUTH TESTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("========================================================\n");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTrashAuthTests();
