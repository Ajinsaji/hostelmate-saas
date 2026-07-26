const mongoose = require("mongoose");

const analyticsAlertRuleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    metric: {
      type: String,
      enum: [
        "Occupancy Rate",
        "Treasury Balance",
        "Payroll Cost",
        "Food Wastage",
        "Outstanding Rent",
      ],
      required: true,
    },
    condition: {
      type: String,
      enum: ["Above", "Below", "Equals"],
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    notificationChannels: {
      type: [String],
      default: ["In-App"],
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

analyticsAlertRuleSchema.index({ tenantId: 1, enabled: 1 });

module.exports = mongoose.model("AnalyticsAlertRule", analyticsAlertRuleSchema);
