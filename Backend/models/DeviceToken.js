const mongoose = require("mongoose");

const deviceTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    role: { type: String, default: "owner", index: true },

    hostelId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },

    token: { type: String, required: true, unique: true, index: true },

    platform: { type: String, default: "web" },

    deviceType: { type: String, default: "mobile" }, // mobile | tablet | desktop

    deviceName: { type: String, default: "Android / Mobile Device" },

    browser: { type: String, default: "Chrome" },

    os: { type: String, default: "Android" },

    ipAddress: { type: String, default: "" },

    isActive: { type: Boolean, default: true },

    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeviceToken", deviceTokenSchema);

