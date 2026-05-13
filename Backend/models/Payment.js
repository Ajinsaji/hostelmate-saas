const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  hostelId: mongoose.Schema.Types.ObjectId,

  residentId: mongoose.Schema.Types.ObjectId,

  month: String,

  totalRent: Number,

  entries: [
    {
      amount: Number,

      method: String,

      proof: String,

      verified: {
        type: Boolean,
        default: false,
      },

      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  balance: Number,

  status: {
    type: String,
    default: "pending",
  },

  paymentMethod: {
    type: String,
    enum: ["cash", "online", "partial"],
    default: "cash",
  },

  cashAmount: {
    type: Number,
    default: 0,
  },

  onlineAmount: {
    type: Number,
    default: 0,
  },

  paidAmount: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "Payment",
 paymentSchema
);
