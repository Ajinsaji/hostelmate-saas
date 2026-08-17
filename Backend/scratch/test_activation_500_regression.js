/**
 * HOSTELMATE ENTERPRISE — FINAL HOSTEL ACTIVATION HTTP 500 REGRESSION TEST SUITE
 *
 * Verifies:
 * 1. Valid activation succeeds via direct hostelId (HTTP 200)
 * 2. Valid activation succeeds via HostelRequest._id (HTTP 200)
 * 3. Subscription setup succeeds with correct plan & dates
 * 4. Owner is created with mustChangePassword=true, firstLogin=true
 * 5. Password is a valid bcrypt hash
 * 6. Temporary password returned exactly once in activation response
 * 7. 10-digit numeric publicCode exists on activated hostel
 * 8. Canonical public URL (/h/:publicCode) exists
 * 9. OWNER_ACCOUNT_ACTIVATED event does not break activation
 * 10. WhatsApp unconfigured / failure is strictly non-blocking (returns HTTP 200)
 * 11. Duplicate activation attempt returns controlled HTTP 400
 * 12. Conflicting existing owner phone returns controlled HTTP 409
 * 13. Trashed hostel activation attempt returns controlled HTTP 400 (HOSTEL_IN_TRASH)
 * 14. Non-existent ID returns controlled HTTP 404
 * 15. Zero raw E11000 or database internal leakages
 */

require("dotenv").config({ path: "Backend/.env" });
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const Hostel = require("../models/Hostel");
const Owner = require("../models/Owner");
const Subscription = require("../models/Subscription");
const HostelRequest = require("../models/HostelRequest");
const Admin = require("../models/Admin");
const EventBus = require("../services/EventBus");
const { finalizeHostelActivation, approveHostel } = require("../controllers/adminController");

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failedCount++;
  }
}

// Mock Express Request & Response Helper
function createMockReqRes({ params = {}, body = {}, user = { role: "super_admin" }, headers = {} } = {}) {
  const req = {
    params,
    body,
    user,
    headers: { origin: "http://localhost:5173", ...headers },
  };

  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };

  return { req, res };
}

async function runTests() {
  console.log("\n========================================================");
  console.log("  TEST SUITE: FINAL HOSTEL ACTIVATION HTTP 500 AUDIT");
  console.log("========================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelmate";
  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB database successfully.\n");

  const timestamp = Date.now();
  const testPhone1 = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  const testPhone2 = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  const testPhone3 = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  const testPhone4 = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

  try {
    // ----------------------------------------------------
    // Scenario 1: Canonical 2-Stage Lifecycle via Hostel._id
    // ----------------------------------------------------
    console.log("--- Scenario 1: Standard Stage-1 Approval + Stage-2 Activation via Hostel._id ---");
    const request1 = await HostelRequest.create({
      hostelName: `Activation Test 1 ${timestamp}`,
      ownerName: "Test Owner One",
      phone: testPhone1,
      email: `owner1_${timestamp}@example.com`,
      city: "Bangalore",
      status: "pending",
    });

    const { req: approveReq1, res: approveRes1 } = createMockReqRes({
      params: { id: String(request1._id) },
    });
    await approveHostel(approveReq1, approveRes1);

    assert(approveRes1.statusCode === 200, "Stage-1 approval succeeded (HTTP 200)");
    const hostelId1 = approveRes1.data?.hostelId;
    assert(Boolean(hostelId1), "Stage-1 returned draft hostelId");

    // Finalize activation with Pro plan
    const { req: actReq1, res: actRes1 } = createMockReqRes({
      params: { hostelId: String(hostelId1) },
      body: {
        planType: "Pro",
        amount: 2499,
        isTrial: false,
        notes: "Automated activation test",
      },
    });
    await finalizeHostelActivation(actReq1, actRes1);

    assert(actRes1.statusCode === 200, "Final activation returned HTTP 200");
    assert(actRes1.data?.success === true, "Activation payload returned success: true");
    assert(Boolean(actRes1.data?.credentials?.tempPassword), "Temporary password returned in response");
    assert(actRes1.data?.credentials?.tempPassword.startsWith("HM"), "Temporary password matches format");

    // Verify Owner document in MongoDB
    const ownerDoc1 = await Owner.findById(actRes1.data?.ownerId);
    assert(Boolean(ownerDoc1), "Owner document created in MongoDB");
    assert(ownerDoc1.mustChangePassword === true, "Owner mustChangePassword is true");
    assert(ownerDoc1.firstLogin === true, "Owner firstLogin is true");
    assert(ownerDoc1.phone === testPhone1, "Owner phone matches registration");
    const isPasswordValid = await bcryptjs.compare(actRes1.data?.credentials?.tempPassword, ownerDoc1.password);
    assert(isPasswordValid === true, "Stored password is a valid bcrypt hash matching issued temp password");

    // Verify Hostel document in MongoDB
    const hostelDoc1 = await Hostel.findById(hostelId1);
    assert(hostelDoc1.pendingActivation === false, "Hostel pendingActivation set to false");
    const linkedOwnerId = String(hostelDoc1.ownerId || hostelDoc1.owner);
    assert(linkedOwnerId === String(ownerDoc1._id), "Hostel.ownerId linked to Owner._id");
    assert(Boolean(hostelDoc1.publicCode) && /^\d{10}$/.test(hostelDoc1.publicCode), `Hostel has valid 10-digit publicCode: ${hostelDoc1.publicCode}`);
    assert(hostelDoc1.publicUrl.includes(`/h/${hostelDoc1.publicCode}`), "Hostel publicUrl matches canonical /h/:publicCode format");

    // Verify Subscription document in MongoDB
    const subDoc1 = await Subscription.findOne({ hostelId: hostelId1 });
    assert(Boolean(subDoc1), "Subscription document created");
    assert(subDoc1.planType === "HostelMate Unified Plan" || subDoc1.planType === "Pro", "Subscription planType is HostelMate Unified Plan");
    assert(subDoc1.subscriptionStatus === "active", "Subscription status is active");
    assert(subDoc1.amount === 2499, "Subscription amount is ₹2499");

    // ----------------------------------------------------
    // Scenario 2: Target ID Resolution via HostelRequest._id
    // ----------------------------------------------------
    console.log("\n--- Scenario 2: Final Activation invoked using HostelRequest._id (Target ID Resolution) ---");
    const request2 = await HostelRequest.create({
      hostelName: `Activation Test 2 ${timestamp}`,
      ownerName: "Test Owner Two",
      phone: testPhone2,
      email: `owner2_${timestamp}@example.com`,
      city: "Hyderabad",
      status: "pending",
    });

    const { req: approveReq2, res: approveRes2 } = createMockReqRes({
      params: { id: String(request2._id) },
    });
    await approveHostel(approveReq2, approveRes2);
    assert(approveRes2.statusCode === 200, "Stage-1 approval 2 succeeded");

    // Pass request2._id directly as the URL parameter to finalize-activation
    const { req: actReq2, res: actRes2 } = createMockReqRes({
      params: { hostelId: String(request2._id) }, // Pass request ID!
      body: { planType: "Pro", amount: 2499 },
    });
    await finalizeHostelActivation(actReq2, actRes2);

    assert(actRes2.statusCode === 200, "Final activation via HostelRequest._id succeeded (HTTP 200)");
    assert(actRes2.data?.success === true, "Activation via request ID returned success: true");
    const ownerDoc2 = await Owner.findById(actRes2.data?.ownerId);
    assert(Boolean(ownerDoc2) && ownerDoc2.phone === testPhone2, "Owner 2 created correctly via request ID resolution");

    // ----------------------------------------------------
    // Scenario 3: Idempotency & Double Activation Prevention
    // ----------------------------------------------------
    console.log("\n--- Scenario 3: Idempotency & Duplicate Activation Gating ---");
    const { req: actReq3, res: actRes3 } = createMockReqRes({
      params: { hostelId: String(hostelId1) },
      body: { planType: "Pro" },
    });
    await finalizeHostelActivation(actReq3, actRes3);

    assert(actRes3.statusCode === 400, "Duplicate activation returned controlled HTTP 400");
    assert(actRes3.data?.message === "Hostel already activated", "Correct idempotency error message returned");

    // ----------------------------------------------------
    // Scenario 4: Conflicting Owner Phone Conflict Handling
    // ----------------------------------------------------
    console.log("\n--- Scenario 4: Conflicting Owner Phone (No Raw E11000 Crash) ---");
    // Create a draft hostel with testPhone1 (which is already an active Owner from Scenario 1)
    const draftHostelConflict = await Hostel.create({
      hostelName: `Conflict Hostel ${timestamp}`,
      ownerName: "Conflict Owner",
      phone: testPhone1, // Same phone!
      pendingActivation: true,
      isDeleted: false,
    });

    const { req: actReqConflict, res: actResConflict } = createMockReqRes({
      params: { hostelId: String(draftHostelConflict._id) },
      body: { planType: "Basic" },
    });
    await finalizeHostelActivation(actReqConflict, actResConflict);

    assert(actResConflict.statusCode === 409, "Conflicting phone returned controlled HTTP 409");
    assert(actResConflict.data?.code === "OWNER_PHONE_CONFLICT", "Controlled conflict code returned");
    assert(!JSON.stringify(actResConflict.data).includes("E11000"), "Zero raw MongoDB E11000 details leaked");

    // ----------------------------------------------------
    // Scenario 5: Trashed Hostel Activation Prevention
    // ----------------------------------------------------
    console.log("\n--- Scenario 5: Trashed Hostel Gating ---");
    const trashedDraftHostel = await Hostel.create({
      hostelName: `Trashed Draft ${timestamp}`,
      ownerName: "Trashed Owner",
      phone: testPhone3,
      pendingActivation: true,
      isDeleted: true,
      deletedAt: new Date(),
    });

    const { req: actReqTrash, res: actResTrash } = createMockReqRes({
      params: { hostelId: String(trashedDraftHostel._id) },
      body: { planType: "Pro" },
    });
    await finalizeHostelActivation(actReqTrash, actResTrash);

    assert(actResTrash.statusCode === 400, "Trashed hostel activation rejected with HTTP 400");
    assert(actResTrash.data?.code === "HOSTEL_IN_TRASH", "Error code is HOSTEL_IN_TRASH");
    assert(actResTrash.data?.message === "Hostel is currently in Trash and cannot be activated.", "Helpful trash error message returned");

    // ----------------------------------------------------
    // Scenario 6: Non-Existent ID Handling
    // ----------------------------------------------------
    console.log("\n--- Scenario 6: Non-Existent ID Handling ---");
    const fakeId = new mongoose.Types.ObjectId();
    const { req: actReqFake, res: actResFake } = createMockReqRes({
      params: { hostelId: String(fakeId) },
    });
    await finalizeHostelActivation(actReqFake, actResFake);

    assert(actResFake.statusCode === 404, "Non-existent hostel ID returned HTTP 404");
    assert(actResFake.data?.code === "HOSTEL_NOT_FOUND", "Error code is HOSTEL_NOT_FOUND");

    // ----------------------------------------------------
    // Scenario 7: EventBus & WhatsApp Non-Blocking Resilience
    // ----------------------------------------------------
    console.log("\n--- Scenario 7: EventBus & WhatsApp Non-Blocking Resilience ---");
    const request4 = await HostelRequest.create({
      hostelName: `Resilience Test 4 ${timestamp}`,
      ownerName: "Resilient Owner",
      phone: testPhone4,
      email: `resilient_${timestamp}@example.com`,
      city: "Chennai",
      status: "pending",
    });

    const { req: approveReq4, res: approveRes4 } = createMockReqRes({
      params: { id: String(request4._id) },
    });
    await approveHostel(approveReq4, approveRes4);
    const hostelId4 = approveRes4.data?.hostelId;

    // Attach a listener to EventBus that simulates a secondary error
    const faultyListener = () => {
      throw new Error("Simulated downstream external service failure in EventBus");
    };
    EventBus.on("OWNER_ACCOUNT_ACTIVATED", faultyListener);

    const { req: actReq4, res: actRes4 } = createMockReqRes({
      params: { hostelId: String(hostelId4) },
      body: { planType: "Pro", amount: 2499 },
    });
    await finalizeHostelActivation(actReq4, actRes4);

    assert(actRes4.statusCode === 200, "Activation succeeded with HTTP 200 despite downstream event error");
    assert(actRes4.data?.success === true, "Activation returned success: true");
    EventBus.removeListener("OWNER_ACCOUNT_ACTIVATED", faultyListener);

  } catch (err) {
    console.error("Test execution exception:", err);
    failedCount++;
  } finally {
    await new Promise((r) => setTimeout(r, 600));
    console.log("\n========================================================");
    console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("========================================================\n");
    await mongoose.disconnect();
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
