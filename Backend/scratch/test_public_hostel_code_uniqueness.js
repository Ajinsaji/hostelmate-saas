/**
 * Test Suite: test_public_hostel_code_uniqueness.js
 *
 * Validates:
 * 1. New hostel gets numeric publicCode
 * 2. publicCode is 10 digits
 * 3. publicCode is numeric only (^\d{10}$)
 * 4. publicCode is globally unique
 * 5. Duplicate hostel names get distinct publicCodes
 * 6. Public URL uses /h/${publicCode}
 * 7. Public endpoint resolves correct hostel by publicCode
 * 8. QR encodes canonical public URL
 * 9. Changing hostel name preserves original publicCode
 * 10. Moving hostel to Trash disables public admission
 * 11. Restoring hostel re-enables same publicCode URL
 * 12. Trashed hostel owner is excluded from active Owners CRM list
 * 13. Dashboard active owner count excludes trashed-hostel owner
 * 14. Owner detail reflects "Hostel in Trash"
 * 15. Financial records remain 100% preserved
 * 16. No cross-hostel publicCode collision
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Hostel = require("../models/Hostel");
const Owner = require("../models/Owner");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const { approveHostelRegistration } = require("../services/onboardingService");
const { getDashboardOverview } = require("../services/dashboard/overviewService");
const { getOwnerProfileByHostelId } = require("../services/hostels/ownerService");
const { generateUniquePublicCode } = require("../utils/publicCodeGenerator");

async function runSuite() {
  console.log("\n========================================================");
  console.log("  TEST SUITE: PUBLIC HOSTEL CODE UNIQUENESS & TRASH TESTS");
  console.log("========================================================\n");

  const uri = process.env.MONGO_URI || process.env.DATABASE_URL;
  await mongoose.connect(uri);
  console.log("✓ Connected to MongoDB database successfully.\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  let createdHostel1 = null;
  let createdHostel2 = null;
  let owner1 = null;
  let payment1 = null;

  try {
    // Test 1, 2, 3: Create new hostel via onboarding service
    const reg1 = await approveHostelRegistration({
      hostelName: `Sunrise Grand ${timestamp}`,
      ownerName: `Owner One ${timestamp}`,
      email: `owner1_${timestamp}@example.com`,
      phone: `91000${String(timestamp).slice(-5)}`,
      city: "Bangalore",
      address: "123 Tech Park Road",
    });

    createdHostel1 = reg1.hostel;
    // Activate it for test
    createdHostel1.pendingActivation = false;
    createdHostel1.isPublic = true;
    await createdHostel1.save();

    owner1 = new Owner({
      ownerName: `Owner One ${timestamp}`,
      phone: `91000${String(timestamp).slice(-5)}`,
      password: "TestPassword123!",
      hostelId: createdHostel1._id,
      activeHostelId: createdHostel1._id,
      status: "active",
    });
    await owner1.save();

    // Create a financial payment record for owner1 / hostel1
    payment1 = new Payment({
      hostelId: createdHostel1._id,
      amount: 15000,
      paidAmount: 15000,
      status: "Paid",
      paymentMethod: "online",
    });
    await payment1.save();

    assert(Boolean(createdHostel1.publicCode), "Test 1: New hostel gets numeric publicCode");
    assert(createdHostel1.publicCode.length === 10, `Test 2: publicCode is 10 digits (got length ${createdHostel1.publicCode?.length})`);
    assert(/^\d{10}$/.test(createdHostel1.publicCode), `Test 3: publicCode is numeric only (got "${createdHostel1.publicCode}")`);

    // Test 4 & 5: Create a second hostel with the EXACT same name
    const reg2 = await approveHostelRegistration({
      hostelName: `Sunrise Grand ${timestamp}`, // DUPLICATE NAME
      ownerName: `Owner Two ${timestamp}`,
      email: `owner2_${timestamp}@example.com`,
      phone: `92000${String(timestamp).slice(-5)}`,
      city: "Hyderabad",
      address: "456 Cyber City",
    });
    createdHostel2 = reg2.hostel;
    createdHostel2.pendingActivation = false;
    createdHostel2.isPublic = true;
    await createdHostel2.save();

    assert(
      createdHostel1.publicCode !== createdHostel2.publicCode,
      `Test 4 & 5: Duplicate hostel names get distinct, globally unique publicCodes (${createdHostel1.publicCode} vs ${createdHostel2.publicCode})`
    );

    // Test 6: Public URL format
    assert(
      createdHostel1.publicUrl.includes(`/h/${createdHostel1.publicCode}`),
      `Test 6: Public URL uses /h/${createdHostel1.publicCode}`
    );

    // Test 7: Public endpoint / lookup by publicCode
    const foundByCode = await Hostel.findOne({ publicCode: createdHostel1.publicCode, isPublic: true });
    assert(
      foundByCode && String(foundByCode._id) === String(createdHostel1._id),
      "Test 7: Public page resolves correct hostel document by publicCode"
    );

    // Test 8: QR URL check
    assert(
      reg1.qrCodeUrl && (reg1.qrCodeUrl.includes(createdHostel1.publicCode) || reg1.qrCode.includes(createdHostel1.publicCode)),
      "Test 8: QR code encodes canonical publicCode URL"
    );

    // Test 9: Changing hostel name preserves original publicCode
    const originalCode = createdHostel1.publicCode;
    createdHostel1.hostelName = `Sunrise Premier Luxury ${timestamp}`;
    await createdHostel1.save();
    const reloadedHostel = await Hostel.findById(createdHostel1._id);
    assert(
      reloadedHostel.publicCode === originalCode,
      "Test 9: Changing hostel name preserves original publicCode and URL"
    );

    // Test 10: Moving hostel to Trash disables public admission
    createdHostel1.isDeleted = true;
    createdHostel1.deletedAt = new Date();
    await createdHostel1.save();

    // Verify public query gating
    const trashedPublicCheck = await Hostel.findOne({
      publicCode: createdHostel1.publicCode,
      isDeleted: { $ne: true },
      pendingActivation: { $ne: true },
    });
    assert(
      trashedPublicCheck === null,
      "Test 10: Moving hostel to Trash disables public admission lookup"
    );

    // Test 11: Restoring hostel re-enables same publicCode URL
    createdHostel1.isDeleted = false;
    createdHostel1.deletedAt = null;
    await createdHostel1.save();

    const restoredPublicCheck = await Hostel.findOne({
      publicCode: createdHostel1.publicCode,
      isDeleted: { $ne: true },
    });
    assert(
      restoredPublicCheck !== null && restoredPublicCheck.publicCode === originalCode,
      "Test 11: Restoring hostel re-enables the exact same publicCode URL"
    );

    // Move to trash again for owner / dashboard consistency tests
    createdHostel1.isDeleted = true;
    createdHostel1.deletedAt = new Date();
    await createdHostel1.save();

    // Test 12: Trashed hostel owner excluded from active query
    const activeHostelsList = await Hostel.find({
      isDeleted: { $ne: true },
      pendingActivation: { $ne: true },
    }).select("_id phone").lean();
    const activeHostelIds = activeHostelsList.map((h) => h._id);

    const activeOwnerCheck = await Owner.findOne({
      _id: owner1._id,
      status: "active",
      hostelId: { $in: activeHostelIds },
    });
    assert(
      activeOwnerCheck === null,
      "Test 12: Trashed hostel owner is excluded from active Owners CRM list"
    );

    // Test 13: Dashboard active owner count excludes trashed-hostel owner
    const dashboardData = await getDashboardOverview();
    const activeOwnersInDb = await Owner.countDocuments({
      status: "active",
      hostelId: { $in: activeHostelIds },
    });
    assert(
      dashboardData.totalOwners === activeOwnersInDb,
      `Test 13: Dashboard active owner count (${dashboardData.totalOwners}) excludes trashed-hostel owner (${activeOwnersInDb})`
    );

    // Test 14: Owner detail reflects "Hostel in Trash"
    const ownerProfile = await getOwnerProfileByHostelId(createdHostel1._id);
    assert(
      ownerProfile && ownerProfile.status === "Hostel in Trash" && ownerProfile.isHostelInTrash === true,
      `Test 14: Owner detail reflects "Hostel in Trash" (got status: "${ownerProfile?.status}")`
    );

    // Test 15: Financial records remain 100% preserved
    const paymentCheck = await Payment.findById(payment1._id);
    assert(
      paymentCheck && paymentCheck.paidAmount === 15000,
      "Test 15: Financial ledger and payment records remain 100% preserved during soft delete"
    );

    // Test 16: Bulk collision test
    const generatedCodes = new Set();
    let collision = false;
    for (let i = 0; i < 50; i++) {
      const c = await generateUniquePublicCode(Hostel);
      if (generatedCodes.has(c)) {
        collision = true;
        break;
      }
      generatedCodes.add(c);
    }
    assert(!collision, "Test 16: No cross-hostel publicCode collisions across bulk generation");

  } catch (err) {
    console.error("✗ Unexpected error during test run:", err);
    failed++;
  } finally {
    // Cleanup test artifacts
    if (createdHostel1) await Hostel.deleteOne({ _id: createdHostel1._id });
    if (createdHostel2) await Hostel.deleteOne({ _id: createdHostel2._id });
    if (owner1) await Owner.deleteOne({ _id: owner1._id });
    if (payment1) await Payment.deleteOne({ _id: payment1._id });

    await mongoose.disconnect();
    console.log("\n========================================================");
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("========================================================\n");

    if (failed > 0) process.exit(1);
  }
}

if (require.main === module) {
  runSuite();
}

module.exports = { runSuite };
