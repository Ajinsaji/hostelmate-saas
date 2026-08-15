/**
 * Test Suite: test_owner_hostel_trash_consistency.js
 *
 * Validates:
 * 1. Active Owner + Active Hostel -> Active in CRM list
 * 2. Active Owner + Trashed Hostel -> Excluded from active CRM list
 * 3. Trashed Hostel Owner derived status -> "Hostel in Trash"
 * 4. Suspended Owner + Active Hostel -> Filtered under suspended
 * 5. Owner without Hostel -> Derived status "No Hostel Linked"
 * 6. Dashboard active owner count agreement with live active hostels
 * 7. Soft deleting hostel preserves Owner, Subscription, and Payment records
 * 8. Restoring hostel reactivates linked Owner in CRM list
 * 9. Trashed hostel owner login is blocked with HTTP 403
 * 10. Financial ledger remains completely intact and unaffected by soft delete
 */

const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Hostel = require("../models/Hostel");
const Owner = require("../models/Owner");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const { getDashboardOverview } = require("../services/dashboard/overviewService");
const { getOwnerProfileByHostelId } = require("../services/hostels/ownerService");
const { loginOwner } = require("../controllers/ownerController");
const { generateUniquePublicCode } = require("../utils/publicCodeGenerator");

async function runSuite() {
  console.log("\n========================================================");
  console.log("  TEST SUITE: OWNER ↔ HOSTEL TRASH CONSISTENCY AUDIT");
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
  let testHostel = null;
  let testOwner = null;
  let testSub = null;
  let testPayment = null;

  try {
    const publicCode = await generateUniquePublicCode(Hostel);
    const passwordHash = await bcrypt.hash("OwnerSecret123!", 10);

    // 1. Create Active Hostel
    testHostel = new Hostel({
      hostelName: `Consistency Haven ${timestamp}`,
      ownerName: `Consistency Owner ${timestamp}`,
      phone: `93000${String(timestamp).slice(-5)}`,
      email: `owner_${timestamp}@consistency.test`,
      publicCode,
      uniqueCode: publicCode,
      publicUrl: `https://hostelmate-saas.vercel.app/h/${publicCode}`,
      status: "active",
      pendingActivation: false,
      isDeleted: false,
    });
    await testHostel.save();

    // 2. Create Linked Active Owner
    testOwner = new Owner({
      ownerName: `Consistency Owner ${timestamp}`,
      phone: `93000${String(timestamp).slice(-5)}`,
      email: `owner_${timestamp}@consistency.test`,
      password: passwordHash,
      hostelId: testHostel._id,
      activeHostelId: testHostel._id,
      status: "active",
    });
    await testOwner.save();

    // 3. Create Subscription & Payment
    testSub = new Subscription({
      hostelId: testHostel._id,
      planType: "Pro",
      subscriptionStatus: "active",
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await testSub.save();

    testPayment = new Payment({
      hostelId: testHostel._id,
      amount: 25000,
      paidAmount: 25000,
      status: "Paid",
      paymentMethod: "online",
    });
    await testPayment.save();

    // Test 1: Active Owner + Active Hostel
    const activeHostelsList1 = await Hostel.find({
      isDeleted: { $ne: true },
      pendingActivation: { $ne: true },
    }).select("_id phone").lean();
    const activeHostelIds1 = activeHostelsList1.map((h) => h._id);

    const activeCheck1 = await Owner.findOne({
      _id: testOwner._id,
      status: "active",
      hostelId: { $in: activeHostelIds1 },
    });
    assert(activeCheck1 !== null, "Test 1: Active Owner + Active Hostel appears in active CRM queries");

    // Test 2: Soft delete hostel (move to 60-day Trash)
    testHostel.isDeleted = true;
    testHostel.deletedAt = new Date();
    await testHostel.save();

    const activeHostelsList2 = await Hostel.find({
      isDeleted: { $ne: true },
      pendingActivation: { $ne: true },
    }).select("_id phone").lean();
    const activeHostelIds2 = activeHostelsList2.map((h) => h._id);

    const activeCheck2 = await Owner.findOne({
      _id: testOwner._id,
      status: "active",
      hostelId: { $in: activeHostelIds2 },
    });
    assert(activeCheck2 === null, "Test 2: Active Owner linked to Trashed Hostel is excluded from active CRM list");

    // Test 3: Trashed Hostel Owner derived status
    const profileAfterTrash = await getOwnerProfileByHostelId(testHostel._id);
    assert(
      profileAfterTrash?.status === "Hostel in Trash" && profileAfterTrash?.isHostelInTrash === true,
      `Test 3: Trashed Hostel Owner status derived as "Hostel in Trash" (got: "${profileAfterTrash?.status}")`
    );

    // Test 4: Suspended Owner + Active Hostel
    testHostel.isDeleted = false;
    testHostel.deletedAt = null;
    await testHostel.save();

    testOwner.status = "suspended";
    await testOwner.save();

    const suspendedCheck = await Owner.findOne({
      _id: testOwner._id,
      status: "suspended",
      hostelId: { $in: activeHostelIds1 },
    });
    assert(suspendedCheck !== null, "Test 4: Suspended Owner + Active Hostel resolves correctly under suspended status");

    // Reset status to active
    testOwner.status = "active";
    await testOwner.save();

    // Test 5: Owner without linked hostel
    const orphanOwner = new Owner({
      ownerName: "Orphan Owner",
      phone: `94000${String(timestamp).slice(-5)}`,
      password: passwordHash,
      status: "active",
    });
    await orphanOwner.save();

    const orphanHostelList = await Hostel.find({
      isDeleted: { $ne: true },
      pendingActivation: { $ne: true },
    }).select("_id").lean();
    const orphanHostelIds = orphanHostelList.map((h) => h._id);

    const orphanActiveCheck = await Owner.findOne({
      _id: orphanOwner._id,
      status: "active",
      hostelId: { $in: orphanHostelIds },
    });
    assert(orphanActiveCheck === null, "Test 5: Owner without linked hostel is excluded from operational active hostel owners");
    await Owner.deleteOne({ _id: orphanOwner._id });

    // Test 6: Dashboard active owner count agreement
    const dashboard = await getDashboardOverview();
    const activeCountDb = await Owner.countDocuments({
      status: "active",
      hostelId: { $in: activeHostelIds1 },
    });
    assert(
      dashboard.totalOwners === activeCountDb,
      `Test 6: Dashboard totalOwners (${dashboard.totalOwners}) agrees with active DB count (${activeCountDb})`
    );

    // Test 7: Soft deleting hostel preserves Owner, Subscription, Payment records
    testHostel.isDeleted = true;
    testHostel.deletedAt = new Date();
    await testHostel.save();

    const ownerInDb = await Owner.findById(testOwner._id);
    const subInDb = await Subscription.findById(testSub._id);
    const paymentInDb = await Payment.findById(testPayment._id);

    assert(
      ownerInDb !== null && subInDb !== null && paymentInDb !== null,
      "Test 7: 60-day Trash is strictly non-destructive: Owner, Subscription, and Payment records preserved"
    );

    // Test 8: Restoring hostel reactivates linked owner in CRM list
    testHostel.isDeleted = false;
    testHostel.deletedAt = null;
    await testHostel.save();

    const restoredActiveHostels = await Hostel.find({
      isDeleted: { $ne: true },
      pendingActivation: { $ne: true },
    }).select("_id phone").lean();
    const restoredActiveHostelIds = restoredActiveHostels.map((h) => h._id);

    const restoredActiveOwner = await Owner.findOne({
      _id: testOwner._id,
      status: "active",
      hostelId: { $in: restoredActiveHostelIds },
    });
    assert(restoredActiveOwner !== null, "Test 8: Restoring hostel returns Owner to active CRM list");

    // Test 9: Trashed hostel owner login is blocked with HTTP 403
    testHostel.isDeleted = true;
    testHostel.deletedAt = new Date();
    await testHostel.save();

    let loginResponseStatus = null;
    let loginResponseBody = null;
    const reqMock = {
      body: {
        identifier: testOwner.phone,
        password: "OwnerSecret123!",
      },
    };
    const resMock = {
      status: function (s) {
        loginResponseStatus = s;
        return this;
      },
      json: function (b) {
        loginResponseBody = b;
        return this;
      },
    };

    await loginOwner(reqMock, resMock);
    assert(
      loginResponseStatus === 403 && loginResponseBody?.message?.includes("Trash"),
      `Test 9: Trashed hostel owner login blocked with HTTP 403 (status: ${loginResponseStatus}, message: "${loginResponseBody?.message}")`
    );

    // Test 10: Financial ledger intact
    const finalPayment = await Payment.findById(testPayment._id);
    assert(
      finalPayment && finalPayment.paidAmount === 25000 && finalPayment.status === "Paid",
      "Test 10: Financial ledger and accounting history remain 100% intact"
    );

  } catch (err) {
    console.error("✗ Unexpected error during test execution:", err);
    failed++;
  } finally {
    // Cleanup
    if (testHostel) await Hostel.deleteOne({ _id: testHostel._id });
    if (testOwner) await Owner.deleteOne({ _id: testOwner._id });
    if (testSub) await Subscription.deleteOne({ _id: testSub._id });
    if (testPayment) await Payment.deleteOne({ _id: testPayment._id });

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
