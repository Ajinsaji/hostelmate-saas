const mongoose = require("mongoose");

const staffShiftAssignmentSchema = new mongoose.Schema(
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
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
    rotationType: {
      type: String,
      enum: ["Fixed", "Weekly", "Monthly"],
      default: "Fixed",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

staffShiftAssignmentSchema.index({ tenantId: 1, staffId: 1, status: 1 });

module.exports = mongoose.model("StaffShiftAssignment", staffShiftAssignmentSchema);
