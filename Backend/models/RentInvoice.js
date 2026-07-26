const mongoose = require("mongoose");

const rentInvoiceSchema = new mongoose.Schema(
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
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      default: null,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    billingPeriod: {
      type: String,
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    rentAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    maintenanceCharge: {
      type: Number,
      default: 0,
    },
    electricityCharge: {
      type: Number,
      default: 0,
    },
    waterCharge: {
      type: Number,
      default: 0,
    },
    wifiCharge: {
      type: Number,
      default: 0,
    },
    foodCharge: {
      type: Number,
      default: 0,
    },
    laundryCharge: {
      type: Number,
      default: 0,
    },
    parkingCharge: {
      type: Number,
      default: 0,
    },
    otherCharges: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    lateFee: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Partially Paid", "Paid", "Overdue", "Cancelled"],
      default: "Pending",
    },
    notes: {
      type: String,
      default: "",
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

rentInvoiceSchema.pre("save", function (next) {
  if (!this.tenantId) {
    this.tenantId = this.hostelId;
  }
  const addOns =
    (this.maintenanceCharge || 0) +
    (this.electricityCharge || 0) +
    (this.waterCharge || 0) +
    (this.wifiCharge || 0) +
    (this.foodCharge || 0) +
    (this.laundryCharge || 0) +
    (this.parkingCharge || 0) +
    (this.otherCharges || 0);

  this.subtotal = (this.rentAmount || 0) + addOns;
  this.grandTotal = Math.max(0, this.subtotal + (this.lateFee || 0) - (this.discount || 0));
  this.balanceAmount = Math.max(0, this.grandTotal - (this.paidAmount || 0));

  if (this.paidAmount >= this.grandTotal && this.grandTotal > 0) {
    this.paymentStatus = "Paid";
  } else if (this.paidAmount > 0 && this.paidAmount < this.grandTotal) {
    this.paymentStatus = "Partially Paid";
  } else if (this.dueDate < new Date() && this.paymentStatus === "Pending") {
    this.paymentStatus = "Overdue";
  }
  next();
});

rentInvoiceSchema.index({ hostelId: 1, invoiceNumber: 1 });
rentInvoiceSchema.index({ residentId: 1, paymentStatus: 1 });
rentInvoiceSchema.index({ tenantId: 1, isDeleted: 1 });

module.exports = mongoose.model("RentInvoice", rentInvoiceSchema);
