const mongoose = require("mongoose");

const mealAttendanceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      default: null,
    },
    attendanceDate: {
      type: Date,
      default: Date.now,
    },
    meal: {
      type: String,
      enum: ["Breakfast", "Lunch", "Snacks", "Dinner"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Leave", "Guest Meal", "Extra Meal"],
      default: "Present",
    },
    guestName: {
      type: String,
      default: "",
    },
    extraMealCharge: {
      type: Number,
      default: 0,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
  },
  { timestamps: true }
);

mealAttendanceSchema.index({ hostelId: 1, attendanceDate: 1, meal: 1 });

module.exports = mongoose.model("MealAttendance", mealAttendanceSchema);
