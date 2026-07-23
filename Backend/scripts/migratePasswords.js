const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Owner = require('../models/Owner');

const migratePasswords = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Find all owners
    const owners = await Owner.find({});
    console.log(`Found ${owners.length} owners.`);

    let migratedCount = 0;

    for (let owner of owners) {
      if (owner.tempPassword) {
        // If password is not a bcrypt hash
        const isBcrypt = typeof owner.password === 'string' && /^\$2[aby]\$/.test(owner.password);
        if (!isBcrypt) {
          console.log(`Migrating password for owner: ${owner.email || owner.phone}`);
          const salt = await bcrypt.genSalt(10);
          owner.password = await bcrypt.hash(owner.tempPassword, salt);
          await owner.save();
          migratedCount++;
        }
      }
    }

    console.log(`Successfully migrated ${migratedCount} passwords.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migratePasswords();
