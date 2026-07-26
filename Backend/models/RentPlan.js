const mongoose = require("mongoose");

const rentPlanSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    billingCycle: {
      type: String,
      enum: ["Monthly", "Weekly", "Daily", "Custom"],
      default: "Monthly",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDay: {
      type: Number,
      default: 5,
      min: 1,
      max: 31,
    },
    graceDays: {
      type: Number,
      default: 3,
      min: 0,
    },
    lateFeeType: {
      type: String,
      enum: ["Fixed", "Percentage"],
      default: "Fixed",
    },
    lateFeeValue: {
      type: Number,
      default: 100,
      min: 0,
    },
    autoGenerateInvoices: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

rentPlanSchema.index({ hostelId: 1, isDeleted: 1 });

module.exports = mongoose.model("RentPlan", rentPlanSchema);
