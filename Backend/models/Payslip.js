const mongoose = require("mongoose");

const payslipSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    payrollRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayrollRecord",
      required: true,
    },
    pdfUrl: {
      type: String,
      default: "",
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

payslipSchema.index({ tenantId: 1, payrollRecordId: 1 }, { unique: true });

module.exports = mongoose.model("Payslip", payslipSchema);
