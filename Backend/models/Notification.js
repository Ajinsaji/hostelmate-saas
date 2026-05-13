const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },

    // Reduces lookup complexity
    hostelId: { type: mongoose.Schema.Types.ObjectId, default: null },

    type: {
      type: String,
      required: true,
      enum: [
        "admission_submitted",
        "resident_approved",
        "resident_rejected",
        "payment_uploaded",
        "complaint_submitted",
        "subscription_alert",
      ],
    },

    message: { type: String, required: true },

    meta: {
      // route mapping support
      route: { type: String, default: null },
      // ids to build route params
      admissionId: { type: mongoose.Schema.Types.ObjectId, default: null },
      residentId: { type: mongoose.Schema.Types.ObjectId, default: null },
      paymentId: { type: mongoose.Schema.Types.ObjectId, default: null },
      hostelRequestId: { type: mongoose.Schema.Types.ObjectId, default: null },
    },

    isRead: { type: Boolean, default: false },

    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);

