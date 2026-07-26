const mongoose = require("mongoose");

const aiSettingsSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hostel",
    required: true,
    unique: true,
  },
  provider: {
    type: String,
    enum: [
      "HeuristicProvider",
      "OpenAIProvider",
      "GeminiProvider",
      "AzureOpenAIProvider",
      "LocalLLMProvider",
    ],
    default: "HeuristicProvider",
  },
  apiKeyReference: {
    type: String, // Reference to secure vault or env variable key, do not store raw key
  },
  model: {
    type: String,
    default: "default",
  },
  temperature: {
    type: Number,
    default: 0.7,
  },
  maxTokens: {
    type: Number,
    default: 2000,
  },
  heuristicFallback: {
    type: Boolean,
    default: true,
  },
  enableForecasting: {
    type: Boolean,
    default: true,
  },
  enableRecommendations: {
    type: Boolean,
    default: true,
  },
  enableChat: {
    type: Boolean,
    default: true,
  },
  enableAnomalyDetection: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("AISettings", aiSettingsSchema);
