const mongoose = require("mongoose");

const aiConversationSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hostel",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true, // Could be Owner or Staff depending on RBAC
  },
  prompt: {
    type: String,
    required: true,
  },
  intent: {
    type: String, // e.g., 'CheckOccupancy', 'FinancialQuery', 'GeneralChat'
  },
  resultSummary: {
    type: String, // The text response given back to the user
  },
  provider: {
    type: String,
    default: "HeuristicProvider",
  },
  tokensUsed: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AIConversation", aiConversationSchema);
