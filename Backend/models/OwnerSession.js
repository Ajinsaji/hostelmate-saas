const mongoose = require("mongoose");

const ownerSessionSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      index: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      default: null,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    deviceName: {
      type: String,
      default: "Unknown Device",
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
    },
    browser: {
      type: String,
      default: "Unknown Browser",
    },
    operatingSystem: {
      type: String,
      default: "Unknown OS",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ownerSessionSchema.index({ ownerId: 1, isRevoked: 1 });
ownerSessionSchema.index({ ownerId: 1, deviceId: 1 });

module.exports = mongoose.model("OwnerSession", ownerSessionSchema);
