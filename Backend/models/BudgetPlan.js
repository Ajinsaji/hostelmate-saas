const mongoose = require("mongoose");

const budgetPlanSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    financialYear: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    category: {
      type: String,
      enum: ["Payroll", "Food", "Utilities", "Maintenance", "Procurement"],
      required: true,
    },
    budgetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    actualAmount: {
      type: Number,
      default: 0,
    },
    variance: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

budgetPlanSchema.index({ tenantId: 1, financialYear: 1, month: 1 });

module.exports = mongoose.model("BudgetPlan", budgetPlanSchema);
