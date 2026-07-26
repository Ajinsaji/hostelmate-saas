const mongoose = require("mongoose");

const maintenanceLogSchema = new mongoose.Schema(
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
    targetType: {
      type: String,
      enum: ["Room", "Bed", "Building", "Floor"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetName: {
      type: String,
      default: "",
    },
    reason: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expectedCompletion: {
      type: Date,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    cost: {
      type: Number,
      default: 0,
    },
    performedBy: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Scheduled", "In Progress", "Completed", "Cancelled"],
      default: "In Progress",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
  },
  { timestamps: true }
);

maintenanceLogSchema.index({ hostelId: 1, targetType: 1, targetId: 1 });

module.exports = mongoose.model("MaintenanceLog", maintenanceLogSchema);
