const mongoose = require("mongoose");

const payrollPolicySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    salaryCalculationType: {
      type: String,
      enum: ["Monthly", "Daily", "Hourly"],
      default: "Monthly",
    },
    lateDeductionPolicy: {
      type: String,
      enum: ["None", "Half Day", "Hourly"],
      default: "None",
    },
    overtimeCalculationType: {
      type: String,
      enum: ["Hourly", "Multiplier"],
      default: "Hourly",
    },
    overtimeMultiplier: {
      type: Number,
      default: 1.5,
    },
    graceMinutes: {
      type: Number,
      default: 15,
    },
    leaveDeductionPolicy: {
      type: String,
      enum: ["Proportional", "Fixed"],
      default: "Proportional",
    },
    roundingRule: {
      type: String,
      enum: ["Nearest", "Floor", "Ceil"],
      default: "Nearest",
    },
    currency: {
      type: String,
      default: "INR",
    },
    payrollFrequency: {
      type: String,
      enum: ["Monthly", "Weekly"],
      default: "Monthly",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

payrollPolicySchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model("PayrollPolicy", payrollPolicySchema);
