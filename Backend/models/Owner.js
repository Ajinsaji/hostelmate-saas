const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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

// Auto-hash password before save if it was modified and is not already a bcrypt hash
ownerSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  // Skip if already a bcrypt hash
  if (this.password && /^\$2[aby]\$\d{2}\$.{53}$/.test(this.password)) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("Owner", ownerSchema);

