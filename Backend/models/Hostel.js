const mongoose = require("mongoose");

const hostelSchema = new mongoose.Schema({
  hostelName: String,

  ownerName: String,

  phone: String,

  address: String,

  qrImage: String,

  planType: {
    type: String,
    default: "Basic",
  },

  subscriptionStatus: {
    type: String,
    default: "trial",
  },

  planType: {
    type: String,
    default: "Basic",
  },

  isPublic: {
    type: Boolean,
    default: true,
  },

  subscriptionStartDate: Date,

  subscriptionEndDate: Date,

  isFreeAccess: {
    type: Boolean,
    default: false,
  },

  uniqueCode: {
    type: String,
    unique: true,
    sparse: true,
  },

  publicUrl: String,

  qrCodeUrl: String,

  isPublic: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model(
  "Hostel",
  hostelSchema
);
