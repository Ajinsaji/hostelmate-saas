const mongoose = require("mongoose");

const communicationSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    type: {
      type: String,
      enum: ["email", "sms", "whatsapp", "in_app"],
      required: true,
    },
    recipient: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed", "read"],
      default: "pending",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    sentAt: {
      type: Date,
    },
    error: {
      type: String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Communication", communicationSchema);
