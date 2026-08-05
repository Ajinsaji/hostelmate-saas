const mongoose = require("mongoose");

const storageUsageSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      unique: true,
    },
    usedBytes: {
      type: Number,
      default: 0,
    },
    residentImages: {
      type: Number,
      default: 0,
    },
    documents: {
      type: Number,
      default: 0,
    },
    receipts: {
      type: Number,
      default: 0,
    },
    exports: {
      type: Number,
      default: 0,
    },
    otherFiles: {
      type: Number,
      default: 0,
    },
    // Per-hostel tracking for dual storage breakdown
    hostelBreakdown: [
      {
        hostelId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Hostel",
          required: true,
        },
        usedBytes: { type: Number, default: 0 },
        residentImages: { type: Number, default: 0 },
        documents: { type: Number, default: 0 },
        receipts: { type: Number, default: 0 },
        exports: { type: Number, default: 0 },
        otherFiles: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("StorageUsage", storageUsageSchema);
