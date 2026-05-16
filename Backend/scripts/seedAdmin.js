const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");
const Hostel = require("../models/Hostel");
const Subscription = require("../models/Subscription");

require("dotenv").config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
if (!mongoUri) {
  console.error("Missing MONGODB_URI/MONGO_URI in env");
  process.exit(1);
}

const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || "superadmin";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "superadmin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "SuperAdmin@123";

const run = async () => {
  await mongoose.connect(mongoUri);

  const existing = await Admin.findOne({ $or: [{ username: ADMIN_USERNAME }, { email: ADMIN_EMAIL }] });
  if (existing) {
    console.log("Admin already exists. Not seeding:", { id: existing._id, username: existing.username, email: existing.email });
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await Admin.create({
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    phone: process.env.SEED_ADMIN_PHONE || "",
    password: hashed,
    fullName: process.env.SEED_ADMIN_FULLNAME || "Super Admin",
    profileImage: "",
    role: "super_admin",
    status: "active",
  });

  console.log("Seeded default admin:", {
    id: admin._id.toString(),
    username: admin.username,
    email: admin.email,
    // do not print hashed password
    password: ADMIN_PASSWORD,
    role: admin.role,
  });

  await mongoose.disconnect();
};

run().catch((e) => {
  console.error("Seed admin failed:", e?.message || e);
  process.exit(1);
});

