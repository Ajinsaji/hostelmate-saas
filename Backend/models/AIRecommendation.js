const mongoose = require("mongoose");

const aiRecommendationSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hostel",
    required: true,
  },
  category: {
    type: String,
    enum: [
      "Occupancy",
      "Revenue",
      "Churn",
      "Procurement",
      "Payroll",
      "Expense",
      "Treasury",
      "General",
    ],
    required: true,
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium",
  },
  confidence: {
    type: Number, // 0-100
    min: 0,
    max: 100,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Dismissed", "Executed"],
    default: "Pending",
  },
  recommendedAction: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
  },
  evidence: {
    type: mongoose.Schema.Types.Mixed, // flexible JSON for contributing factors/evidence
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Owner",
  },
  executedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AIRecommendation", aiRecommendationSchema);
