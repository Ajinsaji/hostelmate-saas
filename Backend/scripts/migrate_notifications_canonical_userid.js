/**
 * migrate_notifications_canonical_userid.js
 *
 * Safe, idempotent migration script to backfill Notification.userId from recipientId.
 *
 * SAFETY INVARIANTS:
 *   1. Dry-run by default. Pass `--apply` to commit changes.
 *   2. Never assigns an arbitrary or default user to unowned notifications.
 *   3. Never turns null-recipient notifications into broadcasts.
 *   4. Does not delete or mutate valid existing records where userId is already set.
 *   5. Idempotent: safe to run repeatedly.
 *
 * Usage:
 *   node Backend/scripts/migrate_notifications_canonical_userid.js           # Dry-run
 *   node Backend/scripts/migrate_notifications_canonical_userid.js --apply   # Commit
 */

"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error("FATAL: MONGO_URI not found in Backend/.env");
  process.exit(1);
}

const isApply = process.argv.includes("--apply");

async function runMigration() {
  console.log("\n========================================================");
  console.log("  HOSTELMATE — CANONICAL NOTIFICATION userId MIGRATION  ");
  console.log(`  MODE: ${isApply ? ">>> LIVE APPLY <<<" : "DRY-RUN (Simulated — no DB writes)"}`);
  console.log("========================================================\n");

  await mongoose.connect(MONGO_URI);
  const Notification = require("../models/Notification");

  const totalDocs = await Notification.countDocuments();
  console.log(`Total Notification records in DB: ${totalDocs}`);

  // 1. Records with canonical userId already present
  const alreadyCanonical = await Notification.countDocuments({
    userId: { $ne: null, $exists: true },
  });

  // 2. Records needing migration: userId is missing/null, but recipientId exists and is non-null
  const eligibleForMigration = await Notification.find({
    $or: [{ userId: null }, { userId: { $exists: false } }],
    recipientId: { $ne: null, $exists: true },
  }).select("_id recipientId createdAt type").lean();

  // 3. Unresolved records: both userId and recipientId are null/missing
  const unresolvedRecords = await Notification.countDocuments({
    $or: [{ userId: null }, { userId: { $exists: false } }],
    $or: [{ recipientId: null }, { recipientId: { $exists: false } }],
  });

  console.log("\n── Audit Breakdown ──");
  console.log(`  Already have canonical userId: ${alreadyCanonical}`);
  console.log(`  Eligible for backfill (has recipientId, missing userId): ${eligibleForMigration.length}`);
  console.log(`  Unresolved records (no recipientId or userId): ${unresolvedRecords}`);

  if (eligibleForMigration.length === 0) {
    console.log("\n✅ All eligible records already have canonical userId. No action needed.");
    await mongoose.disconnect();
    return;
  }

  if (!isApply) {
    console.log(`\n[DRY RUN] ${eligibleForMigration.length} document(s) would be updated with userId = recipientId.`);
    console.log("To apply these changes, run with the --apply flag:");
    console.log("  node Backend/scripts/migrate_notifications_canonical_userid.js --apply\n");
    await mongoose.disconnect();
    return;
  }

  // Live Apply Mode
  console.log(`\nApplying backfill for ${eligibleForMigration.length} document(s)...`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const doc of eligibleForMigration) {
    if (doc.recipientId && mongoose.Types.ObjectId.isValid(doc.recipientId)) {
      await Notification.updateOne(
        { _id: doc._id, $or: [{ userId: null }, { userId: { $exists: false } }] },
        { $set: { userId: doc.recipientId } }
      );
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`\n✅ Migration Complete:`);
  console.log(`  Successfully backfilled: ${updatedCount}`);
  console.log(`  Skipped (invalid ObjectId): ${skippedCount}`);
  console.log(`  Unresolved records left safe & untouched: ${unresolvedRecords}`);

  await mongoose.disconnect();
}

runMigration().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
