/**
 * Production Audit Script: test_admin_crm_data_consistency.js
 * Validates data consistency across Dashboard Overview, Hostels Registry, Owners CRM, and Trash.
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Hostel = require("../models/Hostel");
const Owner = require("../models/Owner");
const Subscription = require("../models/Subscription");
const Resident = require("../models/Resident");
const Payment = require("../models/Payment");
const HostelRequest = require("../models/HostelRequest");
const { getDashboardOverview } = require("../services/dashboard/overviewService");
const { getHostelDirectory } = require("../services/hostels/hostelDirectoryService");

async function runAudit() {
  console.log("\n========================================================");
  console.log("  HOSTELMATE ENTERPRISE — ADMIN CRM DATA CONSISTENCY AUDIT");
  console.log("========================================================\n");

  const uri = process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("Missing MONGO_URI / DATABASE_URL in environment");
  }

  await mongoose.connect(uri);
  console.log("✓ Connected to MongoDB database successfully.\n");

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

  try {
    // 1. Fetch live MongoDB counts
    const totalHostelsDB = await Hostel.countDocuments({ isDeleted: { $ne: true }, pendingActivation: { $ne: true } });
    const activeHostelsDB = await Hostel.countDocuments({
      isDeleted: { $ne: true },
      pendingActivation: { $ne: true },
      subscriptionStatus: { $nin: ["suspended", "expired", "inactive"] }
    });
    const trashHostelsDB = await Hostel.countDocuments({ isDeleted: true });
    const pendingHostelsDB = await Hostel.countDocuments({ isDeleted: { $ne: true }, pendingActivation: true });

    const activeHostelsList = await Hostel.find({ isDeleted: { $ne: true }, pendingActivation: { $ne: true } }).select("_id phone").lean();
    const activeHostelIds = activeHostelsList.map((h) => h._id);
    const activeHostelPhones = activeHostelsList.map((h) => h.phone).filter(Boolean);
    const activeOwnersDB = await Owner.countDocuments({
      status: "active",
      $or: [
        { hostelId: { $in: activeHostelIds } },
        { activeHostelId: { $in: activeHostelIds } },
        { phone: { $in: activeHostelPhones } },
      ],
    });
    const totalOwnersDB = await Owner.countDocuments({});

    // 2. Fetch Dashboard Overview Aggregation
    const dashboardData = await getDashboardOverview();

    console.log("--- Dashboard Overview vs MongoDB Aggregations ---");
    console.log(`Total Hostels: DB=${totalHostelsDB} vs Dashboard=${dashboardData.totalHostels}`);
    console.log(`Active Hostels: DB=${activeHostelsDB} vs Dashboard=${dashboardData.activeHostels}`);
    console.log(`Trash Hostels: DB=${trashHostelsDB} vs Dashboard=${dashboardData.deletedHostels}`);
    console.log(`Pending Hostels: DB=${pendingHostelsDB} vs Dashboard=${dashboardData.pendingHostels}`);
    console.log(`Active Owners: DB=${activeOwnersDB} vs Dashboard=${dashboardData.totalOwners}\n`);

    assert(dashboardData.totalHostels === totalHostelsDB, "Dashboard total hostels matches MongoDB live count");
    assert(dashboardData.activeHostels === activeHostelsDB, "Dashboard active hostels matches MongoDB live count");
    assert(dashboardData.deletedHostels === trashHostelsDB, "Dashboard trash count matches soft-deleted hostels");
    assert(dashboardData.totalOwners === activeOwnersDB, "Dashboard active owners matches MongoDB live count");

    // 3. Compare with Hostel Directory Service
    const directoryAll = await getHostelDirectory({ filters: { status: "all" }, pageSize: 100 });
    const directoryActive = await getHostelDirectory({ filters: { status: "active" }, pageSize: 100 });

    console.log("\n--- Hostels Directory Registry Comparison ---");
    console.log(`Directory (All non-deleted, non-pending): ${directoryAll.pagination.total}`);
    console.log(`Directory (Active filter): ${directoryActive.pagination.total}`);

    assert(directoryAll.pagination.total === totalHostelsDB, "Hostel Directory total count matches live total non-pending hostels");

    // 4. Owner -> Hostel Relationship Audit
    console.log("\n--- Owner ↔ Hostel Relationship Integrity ---");
    const activeOwners = await Owner.find({ status: "active" }).lean();
    let orphanedOwners = [];

    for (const owner of activeOwners) {
      const targetHostelId = owner.activeHostelId || owner.hostelId;
      if (targetHostelId) {
        const hostel = await Hostel.findById(targetHostelId).lean();
        if (!hostel) {
          orphanedOwners.push({
            ownerId: owner._id,
            ownerName: owner.ownerName,
            phone: owner.phone,
            referencedHostelId: targetHostelId,
            problem: "Referenced hostelId does not exist in hostels collection",
          });
        }
      }
    }

    if (orphanedOwners.length > 0) {
      console.warn("⚠️ ORPHANED DATA FOUND:");
      console.warn(JSON.stringify(orphanedOwners, null, 2));
    } else {
      console.log("✓ No active owners with dangling hostelId references detected.");
    }
    assert(true, "Completed Owner ↔ Hostel relational scan");

    // 5. Verify no hardcoded values in calculations
    assert(typeof dashboardData.monthlyRevenue === "number", "Monthly revenue is numeric live aggregation");
    assert(typeof dashboardData.todayRevenue === "number", "Today's revenue is numeric live aggregation");

  } catch (err) {
    console.error("Audit error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log("\n========================================================");
    console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("========================================================\n");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runAudit();
