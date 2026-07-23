const mongoose = require("mongoose");

const backupSchema = new mongoose.Schema({
  backupId: {
    type: String,
    required: true,
    unique: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  },
  sizeBytes: {
    type: Number,
    default: 0
  },
  durationMs: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"],
    default: "PENDING"
  },
  fileName: {
    type: String
  },
  errorMessage: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Backup", backupSchema);
