const mongoose = require("mongoose");

const financialPeriodSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["Open", "Closed", "Locked"],
      default: "Open",
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    closedDate: {
      type: Date,
    },
    unlockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    unlockedDate: {
      type: Date,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

financialPeriodSchema.index({ hostelId: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("FinancialPeriod", financialPeriodSchema);
