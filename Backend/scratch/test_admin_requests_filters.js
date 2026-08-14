/**
 * Test: test_admin_requests_filters.js
 * Validates Onboarding Requests filtering, multi-field search, status counts, and safe request removal.
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const HostelRequest = require("../models/HostelRequest");
const Hostel = require("../models/Hostel");
const Owner = require("../models/Owner");
const Payment = require("../models/Payment");
const { getAllRequests, deleteRequest } = require("../controllers/adminController");

async function runRequestsTests() {
  console.log("\n========================================================");
  console.log("  ONBOARDING REQUESTS — SEARCH, FILTER & REMOVE TESTS");
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

  // Mock Response creator
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
    const testPhoneA = `99991${Math.floor(10000 + Math.random() * 90000)}`;
    const testPhoneB = `99992${Math.floor(10000 + Math.random() * 90000)}`;
    const testPhoneC = `99993${Math.floor(10000 + Math.random() * 90000)}`;

    // Create test requests
    const reqPending = await HostelRequest.create({
      hostelName: `Sunrise_Hostel_${timestamp}`,
      ownerName: "Ajin Saji",
      phone: testPhoneA,
      city: "Kochi",
      district: "Ernakulam",
      email: `ajin_${timestamp}@example.com`,
      status: "pending",
    });

    const reqRejected = await HostelRequest.create({
      hostelName: `Sreedevi_Residency_${timestamp}`,
      ownerName: "Sreedevi Nair",
      phone: testPhoneB,
      city: "Trivandrum",
      district: "Trivandrum",
      email: `sreedevi_${timestamp}@example.com`,
      status: "rejected",
    });

    const reqActivated = await HostelRequest.create({
      hostelName: `Apex_Grand_${timestamp}`,
      ownerName: "Vikram Malhotra",
      phone: testPhoneC,
      city: "Bangalore",
      district: "Bangalore Urban",
      email: `vikram_${timestamp}@example.com`,
      status: "activated",
    });

    // TEST 1: Fetch all requests
    const mockRes1 = createMockRes();
    await getAllRequests({ query: {} }, mockRes1);
    assert(mockRes1.statusCode === 200 && mockRes1.body.success, "getAllRequests returns 200 with success");
    assert(Array.isArray(mockRes1.body.requests), "Requests list returned as array");
    assert(mockRes1.body.counts && typeof mockRes1.body.counts.all === "number", "Status counts included in response");

    // TEST 2: Status filtering
    const mockResStatus = createMockRes();
    await getAllRequests({ query: { status: "rejected" } }, mockResStatus);
    const rejectedList = mockResStatus.body.requests || [];
    const allRejected = rejectedList.every(r => String(r.status).toLowerCase() === "rejected");
    assert(allRejected && rejectedList.some(r => r._id.toString() === reqRejected._id.toString()), "Status filter 'rejected' returns only rejected requests");

    // TEST 3: Search by owner name
    const mockResSearch = createMockRes();
    await getAllRequests({ query: { search: "Sreedevi" } }, mockResSearch);
    const searchList = mockResSearch.body.requests || [];
    assert(searchList.some(r => r._id.toString() === reqRejected._id.toString()), "Search by owner name 'Sreedevi' finds matching request");

    // TEST 4: Combined Search + Status Filter
    const mockResCombined = createMockRes();
    await getAllRequests({ query: { search: `Sunrise_Hostel_${timestamp}`, status: "pending" } }, mockResCombined);
    const combinedList = mockResCombined.body.requests || [];
    assert(combinedList.length === 1 && combinedList[0]._id.toString() === reqPending._id.toString(), "Combined search + status filter yields exact matching request");

    // TEST 5: Remove Rejected Request & Verify Isolation
    // First, create a mock payment and active hostel to verify safe isolation
    const mockHostel = await Hostel.create({
      hostelName: `Safe_Hostel_${timestamp}`,
      phone: `88888${Math.floor(10000 + Math.random() * 90000)}`,
      pendingActivation: false,
    });
    const mockPayment = await Payment.create({
      hostelId: mockHostel._id,
      amount: 5000,
      paidAmount: 5000,
      status: "Paid",
    });

    const mockResDelete = createMockRes();
    await deleteRequest({ params: { id: reqRejected._id.toString() } }, mockResDelete);
    assert(mockResDelete.statusCode === 200 && mockResDelete.body.success, "deleteRequest returns 200 on safe removal");

    // Verify request is removed
    const checkDeleted = await HostelRequest.findById(reqRejected._id);
    assert(!checkDeleted, "Rejected request document removed from MongoDB");

    // Verify financial and hostel data remain intact
    const checkHostel = await Hostel.findById(mockHostel._id);
    const checkPayment = await Payment.findById(mockPayment._id);
    assert(checkHostel && !checkHostel.isDeleted, "Active hostel is unaffected by request deletion");
    assert(checkPayment && checkPayment.paidAmount === 5000, "Payment records are completely protected and intact");

    // Cleanup test data
    await HostelRequest.deleteMany({ _id: { $in: [reqPending._id, reqActivated._id] } });
    await Hostel.findByIdAndDelete(mockHostel._id);
    await Payment.findByIdAndDelete(mockPayment._id);

  } catch (err) {
    console.error("Requests test error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log("\n========================================================");
    console.log(`REQUESTS TESTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("========================================================\n");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runRequestsTests();
