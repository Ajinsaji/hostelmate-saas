const mongoose = require("mongoose");

const securityDepositSchema = new mongoose.Schema(
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
    depositAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    refundedAmount: {
      type: Number,
      default: 0,
    },
    refundDate: {
      type: Date,
      default: null,
    },
    balance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Partially Refunded", "Refunded", "Forfeited"],
      default: "Active",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

securityDepositSchema.pre("save", function () {
  if (!this.tenantId) {
    this.tenantId = this.hostelId;
  }
  this.balance = Math.max(0, (this.depositAmount || 0) - (this.refundedAmount || 0));
  if (this.refundedAmount >= this.depositAmount && this.depositAmount > 0) {
    this.status = "Refunded";
  } else if (this.refundedAmount > 0 && this.refundedAmount < this.depositAmount) {
    this.status = "Partially Refunded";
  }
});

securityDepositSchema.index({ hostelId: 1, residentId: 1 });

module.exports = mongoose.model("SecurityDeposit", securityDepositSchema);
