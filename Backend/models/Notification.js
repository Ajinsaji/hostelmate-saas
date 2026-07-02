const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },

    // Reduces lookup complexity and supports cross-hostel scoping.
    hostelId: { type: mongoose.Schema.Types.ObjectId, default: null },

    title: { type: String, default: "HostelMate" },
    message: { type: String, required: true },

    type: {
      type: String,
      required: true,
      enum: [
        "admission_submitted",
        "resident_approved",
        "resident_rejected",
        "payment_uploaded",
        "complaint_submitted",
        "complaint_raised",
        "resident_added",
        "resident_checkout",
        "bed_assigned",
        "room_added",
        "room_deleted",
        "subscription_alert",
        "subscription_reminder",
        "subscription_expired",
        "system_update",
        "reminder",
      ],
    },

    category: { type: String, default: "updates" },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
    icon: { type: String, default: null },
    actionUrl: { type: String, default: null },

    receiverRole: { type: String, default: null },

    meta: {
      route: { type: String, default: null },
      admissionId: { type: mongoose.Schema.Types.ObjectId, default: null },
      residentId: { type: mongoose.Schema.Types.ObjectId, default: null },
      paymentId: { type: mongoose.Schema.Types.ObjectId, default: null },
      hostelRequestId: { type: mongoose.Schema.Types.ObjectId, default: null },
      relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    },

    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);

