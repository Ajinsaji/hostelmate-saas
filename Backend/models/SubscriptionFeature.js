const mongoose = require("mongoose");

const subscriptionFeatureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["Core", "Operations", "Communication", "Finance", "Advanced"],
      default: "Core",
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubscriptionFeature", subscriptionFeatureSchema);
