/**
 * Migration Script: migrate_hostel_public_codes.js
 *
 * Scans all Hostel documents in MongoDB:
 * 1. Checks if publicCode is missing, invalid (not 10-digit numeric), or duplicate.
 * 2. Generates a cryptographically random, collision-free 10-digit numeric publicCode.
 * 3. Updates canonical publicUrl to `${FRONTEND_URL}/h/${publicCode}`.
 * 4. Preserves all hostel names, financial history, subscriptions, payments, and IDs.
 * 5. Verifies 100% of hostels have unique publicCode.
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Hostel = require("../models/Hostel");
const { generateUniquePublicCode } = require("../utils/publicCodeGenerator");

async function migrateHostelPublicCodes() {
  console.log("\n========================================================");
  console.log("  MIGRATING HOSTEL PUBLIC CODES TO CANONICAL NUMERIC CODES");
  console.log("========================================================\n");

  const uri = process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!uri) {
    console.error("✗ Error: MONGO_URI or DATABASE_URL not set in environment.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("✓ Connected to MongoDB database successfully.");

  const frontendBase = process.env.FRONTEND_URL || process.env.VITE_APP_URL || "https://hostelmate-saas.vercel.app";
  const cleanFrontendBase = String(frontendBase).replace(/\/$/, "");

  try {
    const allHostels = await Hostel.find({});
    console.log(`Found ${allHostels.length} total Hostel documents in database.`);

    let updatedCount = 0;
    let skippedCount = 0;
    const seenCodes = new Set();

    for (const hostel of allHostels) {
      const currentCode = hostel.publicCode;
      const isValid10DigitNumeric = currentCode && /^\d{10}$/.test(currentCode);
      const isDuplicate = currentCode && seenCodes.has(currentCode);

      if (isValid10DigitNumeric && !isDuplicate) {
        seenCodes.add(currentCode);
        skippedCount++;
        // Update publicUrl if needed
        const expectedPublicUrl = `${cleanFrontendBase}/h/${currentCode}`;
        if (!hostel.publicUrl || !hostel.publicUrl.includes(`/h/${currentCode}`)) {
          hostel.publicUrl = expectedPublicUrl;
          await hostel.save();
        }
      } else {
        // Generate fresh unique 10-digit numeric publicCode
        const newCode = await generateUniquePublicCode(Hostel);
        seenCodes.add(newCode);

        hostel.publicCode = newCode;
        hostel.publicUrl = `${cleanFrontendBase}/h/${newCode}`;
        if (!hostel.uniqueCode) {
          hostel.uniqueCode = newCode;
        }

        await hostel.save();
        updatedCount++;
        console.log(`  Updated Hostel "${hostel.hostelName || hostel.name}" (_id: ${hostel._id}) -> publicCode: ${newCode}`);
      }
    }

    console.log("\n--- Migration Progress ---");
    console.log(`✓ Hostels already having valid publicCode: ${skippedCount}`);
    console.log(`✓ Hostels migrated with new publicCode: ${updatedCount}`);

    // Verification Step: Guarantee 100% of hostels have unique 10-digit publicCode
    console.log("\n--- Verifying Database Post-Migration ---");
    const postHostels = await Hostel.find({});
    const codeCounts = new Map();
    let invalidCount = 0;

    for (const h of postHostels) {
      if (!h.publicCode || !/^\d{10}$/.test(h.publicCode)) {
        invalidCount++;
        console.error(`✗ FAIL: Hostel ${h._id} has invalid publicCode: ${h.publicCode}`);
      }
      codeCounts.set(h.publicCode, (codeCounts.get(h.publicCode) || 0) + 1);
    }

    let duplicateCount = 0;
    for (const [code, count] of codeCounts.entries()) {
      if (count > 1) {
        duplicateCount++;
        console.error(`✗ FAIL: Duplicate publicCode found: ${code} (count: ${count})`);
      }
    }

    if (invalidCount === 0 && duplicateCount === 0) {
      console.log(`✓ SUCCESS: 100% of ${postHostels.length} hostels have unique 10-digit numeric publicCodes!`);
    } else {
      throw new Error(`Migration verification failed: ${invalidCount} invalid, ${duplicateCount} duplicates.`);
    }

  } catch (err) {
    console.error("✗ Migration failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n========================================================");
    console.log("  MIGRATION COMPLETED SUCCESSFULLY");
    console.log("========================================================\n");
  }
}

if (require.main === module) {
  migrateHostelPublicCodes();
}

module.exports = { migrateHostelPublicCodes };
