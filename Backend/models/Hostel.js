const mongoose = require("mongoose");

const hostelSchema = new mongoose.Schema({
  hostelName: String,

  ownerName: String,

  phone: String,

  address: String,

  state: {
    type: String,
    default: "",
  },

  district: {
    type: String,
    default: "",
  },

  city: {
    type: String,
    default: "",
  },

  pincode: {
    type: String,
    default: "",
  },

  hostelType: {
    type: String,
    default: "",
  },

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

  qrCodeUrl: {
    type: String,
    default: "",
  },

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

  // Activation gating for SaaS onboarding (Phase 1)
  // When true, owner login/dashboard must be blocked until subscription activation is finalized.
  pendingActivation: {
    type: Boolean,
    default: true,
  },
});


module.exports = mongoose.model(
  "Hostel",
  hostelSchema
);
