const mongoose = require("mongoose");

const hostelRequestSchema = new mongoose.Schema(
  {
    ownerName: String,

    phone: {
      type: String,
      index: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      default: null,
      index: true,
    },

    isExistingOwner: {
      type: Boolean,
      default: false,
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

    // Owner Specific Permanent Location
    ownerPincode: String,
    ownerState: String,
    ownerDistrict: String,
    ownerCity: String,

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
    source: {
      type: String,
      enum: ["public", "admin", "existing_owner"],
      default: "public",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
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

