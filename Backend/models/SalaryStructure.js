const mongoose = require("mongoose");

const salaryStructureSchema = new mongoose.Schema(
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
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    houseRentAllowance: {
      type: Number,
      default: 0,
    },
    foodAllowance: {
      type: Number,
      default: 0,
    },
    travelAllowance: {
      type: Number,
      default: 0,
    },
    medicalAllowance: {
      type: Number,
      default: 0,
    },
    otherAllowances: {
      type: Number,
      default: 0,
    },
    providentFund: {
      type: Number,
      default: 0,
    },
    esi: {
      type: Number,
      default: 0,
    },
    professionalTax: {
      type: Number,
      default: 0,
    },
    incomeTax: {
      type: Number,
      default: 0,
    },
    otherDeductions: {
      type: Number,
      default: 0,
    },
    paymentMode: {
      type: String,
      enum: ["Bank Transfer", "Cash", "Cheque", "UPI"],
      default: "Bank Transfer",
    },
    bankName: {
      type: String,
      default: "",
    },
    accountHolder: {
      type: String,
      default: "",
    },
    accountNumber: {
      type: String,
      default: "",
    },
    ifscCode: {
      type: String,
      default: "",
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

salaryStructureSchema.index({ tenantId: 1, staffId: 1, status: 1 });

module.exports = mongoose.model("SalaryStructure", salaryStructureSchema);
