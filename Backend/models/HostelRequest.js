const mongoose = require("mongoose");

const hostelRequestSchema = new mongoose.Schema(
  {
    ownerName: String,

    phone: {
      type: String,
      unique: true,
    },

    hostelId: {
      type: String,
      default: null,
    },

    hostelName: String,

    ownerAddress: String,

    hostelAddress: String,

    // Location (India)
    state: String,
    district: String,
    city: String,
    pincode: String,
    hostelType: String,

    aadhaarFile: String,

    ownerPhoto: String,

    licensePhoto: String,

    status: {
      type: String,
      // Canonical values across the whole system:
      // pending | activation_pending | approved | rejected
      default: "pending",
      lowercase: true,
      enum: ["pending", "activation_pending", "approved", "rejected"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "HostelRequest",
  hostelRequestSchema
);