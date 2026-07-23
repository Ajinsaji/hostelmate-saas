const mongoose = require("mongoose");

const ownerSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },

    ownerName: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      unique: true,
      required: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
    },

    password: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      trim: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      default: "owner",
      enum: ["owner"],
      required: true,
    },

    status: {
      type: String,
      default: "active",
      enum: ["active", "disabled", "suspended"],
    },

    mustChangePassword: {
      type: Boolean,
      default: true,
    },
    firstLogin: {
      type: Boolean,
      default: true,
    },
    passwordChanged: {
      type: Boolean,
      default: false,
    },
    rulesConfigured: {
      type: Boolean,
      default: false,
    },
    roomsConfigured: {
      type: Boolean,
      default: false,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    onboardingStep: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Owner", ownerSchema);

