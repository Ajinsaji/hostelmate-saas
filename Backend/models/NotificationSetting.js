const mongoose = require("mongoose");

const notificationSettingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, default: null },
    role: { type: String, required: true },
    categories: {
      payments: { type: Boolean, default: true },
      admissions: { type: Boolean, default: true },
      residents: { type: Boolean, default: true },
      rooms: { type: Boolean, default: true },
      staff: { type: Boolean, default: true },
      subscription: { type: Boolean, default: true },
      system: { type: Boolean, default: true },
    },
    browserNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: false },
    smsNotifications: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NotificationSetting", notificationSettingSchema);
