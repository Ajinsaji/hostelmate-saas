require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Owner = require("../models/Owner");
const Hostel = require("../models/Hostel");
const Resident = require("../models/Resident");

async function cleanupDatabase() {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes("--confirm");

  console.log("Starting Database Cleanup...");
  if (isDryRun) {
    console.log("MODE: --dry-run (No records will be deleted. Pass --confirm to execute.)");
  } else {
    console.log("MODE: EXECUTE (Records will be permanently deleted!)");
  }

  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing from environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Read the audit report
    const reportPath = path.join(__dirname, "database_audit_report.json");
    if (!fs.existsSync(reportPath)) {
      console.error("Audit report not found. Run auditDatabase.js first.");
      process.exit(1);
    }

    const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));

    let totalDeleted = 0;

    // 1. Cleanup Orphan Residents
    if (report.orphanResidents && report.orphanResidents.length > 0) {
      console.log(`Found ${report.orphanResidents.length} orphan residents.`);
      if (!isDryRun) {
        const result = await Resident.deleteMany({ _id: { $in: report.orphanResidents } });
        console.log(`Deleted ${result.deletedCount} orphan residents.`);
        totalDeleted += result.deletedCount;
      }
    }

    // (Add more cleanup logic for duplicates if needed)

    console.log(`\nCleanup Complete!`);
    if (isDryRun) {
      console.log(`This was a DRY RUN. No records were deleted.`);
    } else {
      console.log(`Total records deleted: ${totalDeleted}`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
}

cleanupDatabase();
