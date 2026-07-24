const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hostel",
    required: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Owner", // or Staff/Admin depending on who did it
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  action: {
    type: String,
    required: true,
  },
  actionType: {
    type: String, // CREATE, UPDATE, DELETE, etc.
  },
  entity: {
    type: String, // e.g., 'Payment', 'Resident', 'Room' (same as targetModel but explicit)
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
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
  ipAddress: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
