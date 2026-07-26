const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
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
    vendorName: {
      type: String,
      required: true,
      trim: true,
    },
    vendorCode: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "General",
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    gstNumber: {
      type: String,
      default: "",
    },
    bankAccount: {
      type: String,
      default: "",
    },
    upiId: {
      type: String,
      default: "",
    },
    contactPerson: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
  },
  { timestamps: true }
);

vendorSchema.index({ hostelId: 1, vendorCode: 1 });

module.exports = mongoose.model("Vendor", vendorSchema);
