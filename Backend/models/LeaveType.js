const mongoose = require("mongoose");

const leaveTypeSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    annualLimit: {
      type: Number,
      default: 12,
    },
    carryForward: {
      type: Boolean,
      default: false,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

leaveTypeSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("LeaveType", leaveTypeSchema);
