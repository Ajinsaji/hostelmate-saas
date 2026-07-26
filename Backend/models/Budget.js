const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
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
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenseCategory",
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    budgetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    spentAmount: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    variance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Under Budget", "80% Alert", "90% Alert", "Budget Exceeded"],
      default: "Under Budget",
    },
  },
  { timestamps: true }
);

budgetSchema.pre("save", function (next) {
  if (!this.tenantId) {
    this.tenantId = this.hostelId;
  }
  this.remainingAmount = (this.budgetAmount || 0) - (this.spentAmount || 0);
  this.variance = this.remainingAmount;

  const ratio = this.budgetAmount > 0 ? this.spentAmount / this.budgetAmount : 0;
  if (ratio >= 1) {
    this.status = "Budget Exceeded";
  } else if (ratio >= 0.9) {
    this.status = "90% Alert";
  } else if (ratio >= 0.8) {
    this.status = "80% Alert";
  } else {
    this.status = "Under Budget";
  }
  next();
});

budgetSchema.index({ hostelId: 1, categoryId: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
