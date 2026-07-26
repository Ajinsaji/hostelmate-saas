const mongoose = require("mongoose");

const analyticsSnapshotSchema = new mongoose.Schema(
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
    snapshotDate: {
      type: Date,
      default: Date.now,
    },
    snapshotType: {
      type: String,
      enum: ["Daily", "Weekly", "Monthly"],
      default: "Daily",
    },
    occupancy: {
      type: Number,
      default: 0, // Percentage
    },
    revenue: {
      type: Number,
      default: 0,
    },
    expenses: {
      type: Number,
      default: 0,
    },
    profit: {
      type: Number,
      default: 0,
    },
    treasuryBalance: {
      type: Number,
      default: 0,
    },
    foodCost: {
      type: Number,
      default: 0,
    },
    payrollCost: {
      type: Number,
      default: 0,
    },
    attendanceRate: {
      type: Number,
      default: 0,
    },
    residentCount: {
      type: Number,
      default: 0,
    },
    staffCount: {
      type: Number,
      default: 0,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

analyticsSnapshotSchema.index({ tenantId: 1, snapshotDate: -1, snapshotType: 1 });

module.exports = mongoose.model("AnalyticsSnapshot", analyticsSnapshotSchema);
