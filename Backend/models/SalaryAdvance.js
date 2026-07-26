const mongoose = require("mongoose");

const salaryAdvanceSchema = new mongoose.Schema(
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
    requestDate: {
      type: Date,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Recovered"],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    recoveredInPayroll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayrollRecord",
      default: null,
    },
  },
  { timestamps: true }
);

salaryAdvanceSchema.index({ tenantId: 1, staffId: 1, status: 1 });

module.exports = mongoose.model("SalaryAdvance", salaryAdvanceSchema);
