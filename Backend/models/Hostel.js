const mongoose = require("mongoose");

const hostelSchema = new mongoose.Schema({
  hostelName: String,

  ownerName: String,

  phone: String,

  address: String,

  district: String,

  pincode: String,

  qrImage: String,

  planType: {
    type: String,
    default: "Basic",
  },

  subscriptionStatus: {
    type: String,
    default: "trial",
  },

  isPublic: {
    type: Boolean,
    default: true,
  },

  subscriptionStartDate: Date,

  subscriptionEndDate: Date,

  isFreeAccess: {
    type: Boolean,
    default: false,
  },

  uniqueCode: {
    type: String,
    unique: true,
    sparse: true,
  },

  publicUrl: String,

  qrCodeUrl: String,

  // Rules & Regulations (with versioning)
  currentRulesVersion: String,
  rulesText: String, // current rules text
  rulesVersionHistory: [
    {
      versionId: String,
      versionNumber: Number,
      rulesText: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // Rules configuration
  rulesConfig: {
    requireAadhaar: {
      type: Boolean,
      default: false,
    },
    requireSignature: {
      type: Boolean,
      default: true,
    },
    signatureOptions: {
      type: [String],
      enum: ["digital", "uploaded"],
      default: ["digital"],
    },
    consentText: String,
  },
});

module.exports = mongoose.model(
  "Hostel",
  hostelSchema
);
