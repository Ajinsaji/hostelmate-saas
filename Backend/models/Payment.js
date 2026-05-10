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
});

module.exports = mongoose.model(
  "Payment",
 paymentSchema
);
