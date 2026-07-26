const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    trialPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    residentChargePerResident: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },
    durationDays: {
      type: Number,
      default: 30,
      min: 1,
    },
    features: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubscriptionFeature",
      },
    ],
    addons: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
