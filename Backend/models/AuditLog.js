const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hostel",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Owner", // or Staff/Admin depending on who did it
  },
  action: {
    type: String,
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  targetModel: {
    type: String, // e.g., 'Payment', 'Resident', 'Room'
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // flexible JSON payload
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
