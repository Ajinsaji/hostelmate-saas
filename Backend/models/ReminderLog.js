const mongoose = require("mongoose");

const reminderLogSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
    },
    type: {
      type: String,
      enum: ["Subscription", "Resident Rent"],
      default: "Subscription",
    },
    stage: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      enum: ["InApp", "WhatsApp", "Email", "SMS"],
      default: "InApp",
    },
    sentTime: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Sent", "Failed", "Delivered"],
      default: "Sent",
    },
    message: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

reminderLogSchema.index({ hostelId: 1, sentTime: -1 });

module.exports = mongoose.model("ReminderLog", reminderLogSchema);
