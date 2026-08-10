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
    aadhaarBack: String,
    selfie: String,
    ownerPhoto: String,
    licensePhoto: String,

    idType: { type: String, default: "Aadhaar" },
    idNumber: { type: String, default: "" },
    altPhone: { type: String, default: "" },
    roomsCount: { type: Number, default: 0 },
    capacity: { type: Number, default: 0 },
    amenities: { type: [String], default: [] },

    status: {
      type: String,
      // Canonical values across the whole system:
      // pending | activation_pending | approved | activated | rejected
      default: "pending",
      lowercase: true,
      enum: ["pending", "activation_pending", "approved", "activated", "rejected"],
    },
    email: String,
    company: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    },
    assignedTeam: { type: String, default: "" },
    assignedAt: { type: Date, default: null },
    assignedBy: { type: String, default: "" },
    rejectionReason: String,
    timeline: [{
      action: String,
      date: { type: Date, default: Date.now },
      by: String
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("HostelRequest", hostelRequestSchema);

