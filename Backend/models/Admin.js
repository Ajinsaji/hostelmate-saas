const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  phone: {
    type: String,
    default: "",
  },

  password: {
    type: String,
    required: true,
  },

  fullName: {
    type: String,
    default: "Super Admin",
  },

  profileImage: {
    type: String,
    default: "",
  },

  role: {
    type: String,
    enum: ["super_admin", "admin"],
    default: "super_admin",
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },

  lastLogin: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },

  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },

  loginHistory: [{
    ip: String,
    location: String,
    device: String,
    time: Date,
    status: String
  }],

  activeSessions: [{
    device: String,
    ip: String,
    location: String,
    time: Date
  }]
});

// Auto-hash password before save if it was modified and is not already a bcrypt hash
adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  // Skip if already a bcrypt hash
  if (this.password && /^\$2[aby]\$\d{2}\$.{53}$/.test(this.password)) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("Admin", adminSchema);
