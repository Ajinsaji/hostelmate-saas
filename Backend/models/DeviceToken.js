const mongoose = require("mongoose");

const deviceTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    deviceId: { type: String, required: true, trim: true, index: true },

    role: { type: String, default: "owner", index: true },

    hostelId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },

    token: { type: String, required: true, index: true },

    platform: { type: String, default: "web" },

    deviceType: { type: String, default: "mobile" }, // mobile | tablet | desktop

    deviceName: { type: String, default: "Android / Mobile Device" },

    browser: { type: String, default: "Chrome" },

    os: { type: String, default: "Android" },

    ipAddress: { type: String, default: "" },

    isActive: { type: Boolean, default: true, index: true },

    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound Unique Index: One device entry per (userId, deviceId)
deviceTokenSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

// Notification Fanout Query Index
deviceTokenSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model("DeviceToken", deviceTokenSchema);
