const mongoose = require("mongoose");

const hostelRequestSchema = new mongoose.Schema(
  {
    ownerName: String,

    phone: {
      type: String,
      unique: true,
    },

    hostelName: String,

    ownerAddress: String,

    hostelAddress: String,

    // Location (India)
    state: String,
    district: String,
    city: String,
    pincode: String,

    aadhaarFile: String,

    ownerPhoto: String,

    licensePhoto: String,

    status: {
      type: String,
      // Canonical values across the whole system:
      // pending | approved | rejected
      default: "pending",
      lowercase: true,
      enum: ["pending", "approved", "rejected"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "HostelRequest",
  hostelRequestSchema
);