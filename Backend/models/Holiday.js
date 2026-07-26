const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ["National", "State", "Festival", "Hostel"],
      default: "Festival",
    },
    isWorkingDay: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

holidaySchema.index({ tenantId: 1, hostelId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Holiday", holidaySchema);
