const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    activeHostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      default: null,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    storageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StorageUsage",
      default: null,
    },
    settings: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workspace", workspaceSchema);
