const mongoose = require("mongoose");

const payrollExceptionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    payrollRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayrollRecord",
      default: null,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    exceptionType: {
      type: String,
      enum: [
        "Missing Attendance",
        "Negative Salary",
        "Missing Salary Structure",
        "Duplicate Payroll",
        "Treasury Failure",
        "PDF Failure",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

payrollExceptionSchema.index({ tenantId: 1, resolved: 1 });

module.exports = mongoose.model("PayrollException", payrollExceptionSchema);
