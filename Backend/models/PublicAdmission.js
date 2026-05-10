const mongoose = require("mongoose");

const publicAdmissionSchema = new mongoose.Schema({
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hostel",
  },
  hostelCode: String,
  residentName: String,
  phone: String,
  email: String,
  emergencyContact: String,
  address: String,
  roomPreference: String, // "Single", "Double", etc. or ObjectId
  photoFile: String,
  idProofFile: String,
  signatureFile: String,
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  amountPaid: Number,
  transactionId: String,
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("PublicAdmission", publicAdmissionSchema);
