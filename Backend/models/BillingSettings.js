const mongoose = require("mongoose");

const billingSettingsSchema = new mongoose.Schema(
  {
    trialDays: {
      type: Number,
      default: 30,
      min: 1,
    },
    gracePeriodDays: {
      type: Number,
      default: 3,
      min: 0,
    },
    reminderDays: {
      type: [Number],
      default: [7, 2, 1],
    },
    dueReminderIntervalHours: {
      type: Number,
      default: 5,
      min: 1,
    },
    residentChargeMode: {
      type: String,
      default: "Per Active Resident",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BillingSettings", billingSettingsSchema);
