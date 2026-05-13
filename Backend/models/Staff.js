const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["warden", "cook"],
    },
    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdByOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);
