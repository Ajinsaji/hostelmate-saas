/**
 * ONE-TIME PASSWORD MIGRATION SCRIPT
 * 
 * Purpose: Hash any plaintext passwords in the Admin and Owner collections.
 * Safe to run multiple times — skips already-hashed passwords.
 * 
 * Usage:
 *   node scripts/migratePasswords.js
 * 
 * Requires MONGODB_URI or MONGO_URI in environment (or .env file).
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

require("dotenv").config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
if (!mongoUri) {
  console.error("ERROR: Missing MONGODB_URI or MONGO_URI in environment.");
  process.exit(1);
}

const isBcryptHash = (str) => {
  if (!str || typeof str !== "string") return false;
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(str);
};

const run = async () => {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri.replace(/\/\/.*@/, "//***@"));

  // --- Migrate Admins ---
  const Admin = require("../models/Admin");
  const admins = await Admin.find({});
  let adminMigrated = 0;

  console.log(`\nFound ${admins.length} admin(s).`);
  for (const admin of admins) {
    if (isBcryptHash(admin.password)) {
      console.log(`  [SKIP] ${admin.username} — already hashed`);
      continue;
    }
    console.log(`  [HASH] ${admin.username} — plaintext password detected (length: ${admin.password?.length})`);
    const salt = await bcrypt.genSalt(10);
    // Use updateOne to bypass pre-save hook (we're hashing manually here)
    await Admin.updateOne(
      { _id: admin._id },
      { password: await bcrypt.hash(admin.password, salt) }
    );
    adminMigrated++;
  }
  console.log(`Admin migration complete: ${adminMigrated} password(s) hashed.`);

  // --- Migrate Owners ---
  const Owner = require("../models/Owner");
  const owners = await Owner.find({});
  let ownerMigrated = 0;

  console.log(`\nFound ${owners.length} owner(s).`);
  for (const owner of owners) {
    if (isBcryptHash(owner.password)) {
      console.log(`  [SKIP] ${owner.ownerName || owner.phone} — already hashed`);
      continue;
    }
    console.log(`  [HASH] ${owner.ownerName || owner.phone} — plaintext password detected (length: ${owner.password?.length})`);
    const salt = await bcrypt.genSalt(10);
    await Owner.updateOne(
      { _id: owner._id },
      { password: await bcrypt.hash(owner.password, salt) }
    );
    ownerMigrated++;
  }
  console.log(`Owner migration complete: ${ownerMigrated} password(s) hashed.`);

  // --- Verification ---
  console.log("\n=== VERIFICATION ===");
  const verifyAdmin = await Admin.findOne({ username: "superadmin" });
  if (verifyAdmin) {
    console.log(`Admin "superadmin": hash=${isBcryptHash(verifyAdmin.password)}, length=${verifyAdmin.password?.length}`);
  }

  const verifyOwners = await Owner.find({});
  for (const o of verifyOwners) {
    console.log(`Owner "${o.ownerName}": hash=${isBcryptHash(o.password)}, length=${o.password?.length}`);
  }

  console.log("\n=== MIGRATION COMPLETE ===");
  console.log(`Total: ${adminMigrated} admin(s) + ${ownerMigrated} owner(s) migrated.`);

  await mongoose.disconnect();
};

run().catch((e) => {
  console.error("Migration failed:", e?.message || e);
  process.exit(1);
});
