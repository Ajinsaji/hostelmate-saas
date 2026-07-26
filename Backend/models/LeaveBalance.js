const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    allocated: {
      type: Number,
      default: 12,
    },
    used: {
      type: Number,
      default: 0,
    },
    remaining: {
      type: Number,
      default: 12,
    },
    year: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

leaveBalanceSchema.index({ tenantId: 1, staffId: 1, leaveTypeId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("LeaveBalance", leaveBalanceSchema);
