const mongoose = require("mongoose");

const hostelRequestSchema = new mongoose.Schema(
  {
    ownerName: String,

    phone: {
      type: String,
      unique: true,
    },

    hostelName: String,

    ownerAddress: String,

    hostelAddress: String,

    aadhaarFile: String,

    ownerPhoto: String,

    licensePhoto: String,

    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "HostelRequest",
  hostelRequestSchema
);