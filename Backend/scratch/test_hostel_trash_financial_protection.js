/**
 * HOSTELMATE ENTERPRISE — HOSTEL TRASH & FINANCIAL DATA PROTECTION TEST
 *
 * Tests:
 *  1. Create test Hostel.
 *  2. Create associated Owner.
 *  3. Create associated Subscription.
 *  4. Create historical Payment.
 *  5. Delete hostel (Soft Delete).
 *  6. Verify Hostel.isDeleted === true.
 *  7. Verify deletedAt exists.
 *  8. Verify Payment still exists in database.
 *  9. Verify Subscription still exists in database.
 * 10. Verify financial payment amount remains unchanged.
 * 11. Verify hostel is absent from active registry.
 * 12. Verify hostel appears in Trash endpoint (/api/admin/trash/hostels).
 * 13. Restore hostel (/api/admin/trash/hostels/:id/restore).
 * 14. Verify hostel returns to active registry.
 * 15. Verify Payment still exists after restore.
 * 16. Verify Subscription still exists after restore.
 * 17. Verify 60-day retention calculation (daysRemaining).
 */

"use strict";

const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelmate";

// ── Global 90-second watchdog ─────────────────────────────────────────────────
const globalWatchdog = setTimeout(() => {
  console.error("\n❌ TEST TIMEOUT — execution exceeded 90 seconds");
  process.exit(1);
}, 90_000);
globalWatchdog.unref();

const ts = Date.now();
const testPhone = `999${String(ts).slice(-7)}`;
const testHostelName = `TRASH_TEST_HOSTEL_${ts}`;

let testsPassed = 0;
let testsFailed = 0;
let currentTest = 0;
const TOTAL_TESTS = 17;
const startTime = Date.now();

function pass(label) {
  testsPassed++;
  console.log(`  ✓ PASS [${++currentTest}/${TOTAL_TESTS}] ${label}`);
}

function fail(label, detail) {
  testsFailed++;
  currentTest++;
  console.error(`  ✗ FAIL [${currentTest}/${TOTAL_TESTS}] ${label}`);
  if (detail !== undefined) console.error(`         Detail: ${JSON.stringify(detail, null, 2)}`);
}

function section(label) {
  console.log(`\n── ${label} ${"─".repeat(Math.max(0, 60 - label.length))}`);
}

async function runTests() {
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  HOSTELMATE — TRASH & FINANCIAL PROTECTION TEST SUITE");
  console.log("═══════════════════════════════════════════════════════════════\n");

  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });

  const Hostel = require("../models/Hostel");
  const Owner = require("../models/Owner");
  const Subscription = require("../models/Subscription");
  const Payment = require("../models/Payment");
  const { getHostelDirectory } = require("../services/hostels/hostelDirectoryService");
  const { deleteHostel, getTrashHostels, restoreHostelFromTrash } = require("../controllers/adminController");

  let createdHostel = null;
  let createdOwner = null;
  let createdSub = null;
  let createdPayment = null;

  try {
    // ── 1. Create test Hostel ──────────────────────────────────────────────────
    section("Step 1 — Create Test Hostel");
    createdHostel = await Hostel.create({
      hostelName: testHostelName,
      ownerName: `Owner_${ts}`,
      phone: testPhone,
      email: `trash-${ts}@test.invalid`,
      state: "KL",
      district: "Palakkad",
      city: "Elavampadam",
      pincode: "678684",
      pendingActivation: false,
      isDeleted: false,
    });
    if (createdHostel?._id) {
      pass(`Created test hostel ID: ${createdHostel._id}`);
    } else {
      fail("Failed to create test hostel");
    }

    // ── 2. Create Owner ────────────────────────────────────────────────────────
    section("Step 2 — Create Associated Owner");
    createdOwner = await Owner.create({
      hostelId: createdHostel._id,
      ownerName: `Owner_${ts}`,
      phone: testPhone,
      email: `trash-${ts}@test.invalid`,
      password: "TestPassword123!",
      role: "owner",
    });
    if (createdOwner?._id) {
      pass(`Created test owner ID: ${createdOwner._id}`);
    } else {
      fail("Failed to create test owner");
    }

    // ── 3. Create Subscription ─────────────────────────────────────────────────
    section("Step 3 — Create Associated Subscription");
    createdSub = await Subscription.create({
      hostelId: createdHostel._id,
      planType: "Pro",
      status: "Active",
      amount: 4999,
    });
    if (createdSub?._id) {
      pass(`Created test subscription ID: ${createdSub._id}`);
    } else {
      fail("Failed to create test subscription");
    }

    // ── 4. Create Historical Payment ───────────────────────────────────────────
    section("Step 4 — Create Historical Payment Record");
    createdPayment = await Payment.create({
      hostelId: createdHostel._id,
      month: "2026-08",
      totalRent: 12000,
      paidAmount: 12000,
      status: "Paid",
      entries: [{ amount: 12000, method: "upi", verified: true }],
    });
    if (createdPayment?._id) {
      pass(`Created historical payment ID: ${createdPayment._id}`);
    } else {
      fail("Failed to create historical payment");
    }

    // ── 5. Delete Hostel (Soft Delete) ─────────────────────────────────────────
    section("Step 5 — Soft-Delete Hostel");
    const mockReq = { params: { id: String(createdHostel._id) }, admin: { _id: new mongoose.Types.ObjectId(), role: "super_admin" }, body: { reason: "Audit test" } };
    let deleteResBody = null;
    const mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        deleteResBody = data;
        return data;
      },
    };

    await deleteHostel(mockReq, mockRes);
    if (mockRes.statusCode === 200 && deleteResBody?.success) {
      pass("deleteHostel() returned HTTP 200 success response");
    } else {
      fail("deleteHostel() failed", deleteResBody);
    }

    // ── 6. Verify Hostel.isDeleted === true ────────────────────────────────────
    section("Step 6 — Verify Hostel.isDeleted === true");
    const softDeletedHostel = await Hostel.findById(createdHostel._id);
    if (softDeletedHostel?.isDeleted === true) {
      pass("Hostel.isDeleted is strictly true");
    } else {
      fail("Hostel.isDeleted is not true", softDeletedHostel);
    }

    // ── 7. Verify deletedAt exists ─────────────────────────────────────────────
    section("Step 7 — Verify deletedAt Date exists");
    if (softDeletedHostel?.deletedAt instanceof Date) {
      pass(`Hostel.deletedAt is set: ${softDeletedHostel.deletedAt.toISOString()}`);
    } else {
      fail("Hostel.deletedAt is missing or invalid", softDeletedHostel?.deletedAt);
    }

    // ── 8. Verify Payment still exists ─────────────────────────────────────────
    section("Step 8 — Verify Payment record preserved in DB");
    const paymentAfterDelete = await Payment.findById(createdPayment._id);
    if (paymentAfterDelete) {
      pass("Payment record STILL EXISTS in DB (not cascade deleted)");
    } else {
      fail("CRITICAL: Payment record was deleted!");
    }

    // ── 9. Verify Subscription still exists ────────────────────────────────────
    section("Step 9 — Verify Subscription record preserved in DB");
    const subAfterDelete = await Subscription.findById(createdSub._id);
    if (subAfterDelete) {
      pass("Subscription record STILL EXISTS in DB (not cascade deleted)");
    } else {
      fail("CRITICAL: Subscription record was deleted!");
    }

    // ── 10. Verify Financial Amount Unchanged ──────────────────────────────────
    section("Step 10 — Verify Financial Payment Amount Unchanged");
    if (paymentAfterDelete?.totalRent === 12000 && paymentAfterDelete?.paidAmount === 12000) {
      pass("Financial amounts preserved (totalRent: 12000, paidAmount: 12000)");
    } else {
      fail("Financial amounts altered after deletion", paymentAfterDelete);
    }

    // ── 11. Verify Absent from Active Registry ─────────────────────────────────
    section("Step 11 — Verify Absent from Active Directory");
    const directory = await getHostelDirectory({ search: testHostelName });
    const inActiveDirectory = (directory.hostels || []).some((h) => String(h.id || h._id) === String(createdHostel._id));
    if (!inActiveDirectory) {
      pass("Hostel is correctly ABSENT from active directory queries");
    } else {
      fail("Hostel still appears in active directory queries despite being soft deleted");
    }

    // ── 12. Verify Appears in Trash Endpoint ───────────────────────────────────
    section("Step 12 — Verify Appears in Trash List");
    let trashResBody = null;
    const mockTrashRes = {
      status(code) { this.statusCode = code; return this; },
      json(data) { trashResBody = data; return data; },
    };
    await getTrashHostels({}, mockTrashRes);
    const inTrash = (trashResBody?.hostels || []).find((h) => String(h._id) === String(createdHostel._id));
    if (inTrash) {
      pass("Hostel appears in Trash list endpoint");
    } else {
      fail("Hostel missing from Trash list endpoint", trashResBody);
    }

    // ── 13. Restore Hostel ──────────────────────────────────────────────────────
    section("Step 13 — Restore Hostel from Trash");
    let restoreResBody = null;
    const mockRestoreRes = {
      status(code) { this.statusCode = code; return this; },
      json(data) { restoreResBody = data; return data; },
    };
    await restoreHostelFromTrash({ params: { id: String(createdHostel._id) } }, mockRestoreRes);
    if (mockRestoreRes.statusCode === 200 && restoreResBody?.success) {
      pass("restoreHostelFromTrash() returned HTTP 200 success response");
    } else {
      fail("restoreHostelFromTrash() failed", restoreResBody);
    }

    // ── 14. Verify Hostel Returned to Active Registry ──────────────────────────
    section("Step 14 — Verify Returned to Active Directory");
    const directoryAfterRestore = await getHostelDirectory({ search: testHostelName });
    const restoredInActive = (directoryAfterRestore.hostels || []).some((h) => String(h.id || h._id) === String(createdHostel._id));
    if (restoredInActive) {
      pass("Hostel returned to active directory registry");
    } else {
      fail("Hostel missing from active directory after restore");
    }

    // ── 15. Verify Payment Exists After Restore ────────────────────────────────
    section("Step 15 — Verify Payment Exists After Restore");
    const paymentAfterRestore = await Payment.findById(createdPayment._id);
    if (paymentAfterRestore) {
      pass("Payment record intact after hostel restore");
    } else {
      fail("Payment missing after hostel restore");
    }

    // ── 16. Verify Subscription Exists After Restore ───────────────────────────
    section("Step 16 — Verify Subscription Exists After Restore");
    const subAfterRestore = await Subscription.findById(createdSub._id);
    if (subAfterRestore) {
      pass("Subscription record intact after hostel restore");
    } else {
      fail("Subscription missing after hostel restore");
    }

    // ── 17. Verify 60-Day Retention Calculation ────────────────────────────────
    section("Step 17 — Verify 60-Day Retention Days Remaining Calculation");
    if (inTrash && typeof inTrash.daysRemaining === "number" && inTrash.daysRemaining >= 59 && inTrash.daysRemaining <= 60) {
      pass(`daysRemaining calculated correctly: ${inTrash.daysRemaining} days (60-day policy)`);
    } else {
      fail("daysRemaining calculation invalid", inTrash?.daysRemaining);
    }

  } finally {
    // Clean up test documents
    if (createdHostel?._id) await Hostel.deleteOne({ _id: createdHostel._id });
    if (createdOwner?._id) await Owner.deleteOne({ _id: createdOwner._id });
    if (createdSub?._id) await Subscription.deleteOne({ _id: createdSub._id });
    if (createdPayment?._id) await Payment.deleteOne({ _id: createdPayment._id });
    await mongoose.disconnect();
  }
}

runTests()
  .then(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("  TEST RESULTS");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`  Passed : ${testsPassed} / ${TOTAL_TESTS}`);
    console.log(`  Failed : ${testsFailed}`);
    console.log(`  Elapsed: ${elapsed}s`);
    console.log("═══════════════════════════════════════════════════════════════\n");
    clearTimeout(globalWatchdog);
    process.exit(testsFailed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error("\n❌ FATAL TEST ERROR:", err);
    clearTimeout(globalWatchdog);
    mongoose.disconnect().finally(() => process.exit(1));
  });
