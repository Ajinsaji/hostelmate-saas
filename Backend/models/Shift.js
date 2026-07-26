const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
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
    shiftCode: {
      type: String,
      required: true,
      trim: true,
    },
    shiftName: {
      type: String,
      required: true,
      enum: ["Morning", "Evening", "Night", "General"],
      default: "Morning",
    },
    startTime: {
      type: String, // "HH:MM" e.g., "08:00"
      required: true,
    },
    endTime: {
      type: String, // "HH:MM" e.g., "16:00"
      required: true,
    },
    breakDuration: {
      type: Number, // in minutes
      default: 30,
    },
    workingHours: {
      type: Number, // in hours
      default: 8,
    },
    weeklyOff: {
      type: String,
      default: "Sunday",
    },
    color: {
      type: String,
      default: "#10b981",
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
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

shiftSchema.index({ tenantId: 1, shiftCode: 1 }, { unique: true });
shiftSchema.index({ tenantId: 1, hostelId: 1, status: 1 });

module.exports = mongoose.model("Shift", shiftSchema);
