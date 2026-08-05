const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ["base", "pro", "enterprise"],
    },
    hostelLimit: {
      type: Number,
      required: true,
    },
    residentLimit: {
      type: Number,
      required: true,
    },
    staffLimit: {
      type: Number,
      required: true,
    },
    storageLimit: {
      type: Number, // in bytes
      required: true,
    },
    features: {
      type: [String], // e.g. ["ai", "payroll", "analytics", "customBranding", "marketplace", "apiAccess"]
      default: [],
    },
    monthlyPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
