const mongoose = require("mongoose");

const residentSchema = new mongoose.Schema({
  hostelId: mongoose.Schema.Types.ObjectId,

  name: String,

  phone: String,

  email: String,

  gender: String, // male | female | other

  dob: Date, // date of birth

  address: String,

  district: String,

  pincode: String,

  emergencyContact: String,

  photo: String,

  idProof: String,

  roomId: mongoose.Schema.Types.ObjectId,

  bedId: mongoose.Schema.Types.ObjectId,

  monthlyRent: Number,

  depositAmount: Number,

  joinDate: Date,

  // Immutable rules agreement + signature record (copied from PublicAdmission at approval)
  rulesVersionId: String,
  rulesVersionNumber: String,
  acceptedRulesTextSnapshot: String,
  signatureImage: String, // base64 PNG from signature pad
  signatureFile: String, // uploaded signature file path (for backward compatibility)
  signedAt: Date,
  agreementChecked: {
    type: Boolean,
    default: false,
  },

  status: {
    type: String,
    default: "active",
  },
});

module.exports = mongoose.model(
  "Resident",
  residentSchema
);
