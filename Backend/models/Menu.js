const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
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
    menuDate: {
      type: Date,
      required: true,
    },
    breakfast: {
      type: String,
      default: "",
    },
    lunch: {
      type: String,
      default: "",
    },
    snacks: {
      type: String,
      default: "",
    },
    dinner: {
      type: String,
      default: "",
    },
    specialMenu: {
      type: String,
      default: "",
    },
    festivalName: {
      type: String,
      default: "",
    },
    preparedBy: {
      type: String,
      default: "",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Published",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
  },
  { timestamps: true }
);

menuSchema.index({ hostelId: 1, menuDate: 1 }, { unique: true });

module.exports = mongoose.model("Menu", menuSchema);
