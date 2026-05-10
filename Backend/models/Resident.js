const mongoose = require("mongoose");

const residentSchema = new mongoose.Schema({
  hostelId: mongoose.Schema.Types.ObjectId,

  name: String,

  phone: String,

  photo: String,

  idProof: String,

  roomId: mongoose.Schema.Types.ObjectId,

  bedId: mongoose.Schema.Types.ObjectId,

  monthlyRent: Number,

  depositAmount: Number,

  joinDate: Date,

  status: {
    type: String,
    default: "active",
  },
});

module.exports = mongoose.model(
  "Resident",
  residentSchema
);
