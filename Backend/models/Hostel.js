const mongoose = require("mongoose");

const hostelSchema = new mongoose.Schema({
  hostelName: String,

  ownerName: String,

  phone: String,

  address: String,

  state: String,

  district: String,

  city: String,

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

  // Hostel Details
  whatsapp: String,
  description: String,
  amenities: [String], // Array of amenities

  // Rules & Regulations (with versioning)
  currentRulesVersion: String,
  rulesText: String, // current rules text
  rulesVersionNumber: Number, // current version number
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
    enableAadhaar: {
      type: Boolean,
      default: false,
    },
    enableSignature: {
      type: Boolean,
      default: true,
    },
  },

  // Privacy & Consent
  privacyConsentText: String,
  documentRequirements: [String],
  signatureMode: String, // 'digital', 'uploaded', 'both'
  signatureSettings: {
    enabled: {
      type: Boolean,
      default: true,
    },
    requireDigital: Boolean,
    requireUploaded: Boolean,
  },
});

module.exports = mongoose.model(
  "Hostel",
  hostelSchema
);
