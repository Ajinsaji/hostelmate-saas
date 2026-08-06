const mongoose = require("mongoose");

const userReleaseStatusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace"
    },
    version: {
      type: String,
      required: true
    },
    seen: {
      type: Boolean,
      default: false
    },
    seenAt: Date,
    dismissed: {
      type: Boolean,
      default: false
    },
    dismissedAt: Date
  },
  { timestamps: true }
);

userReleaseStatusSchema.index({ userId: 1, version: 1 }, { unique: true });

module.exports = mongoose.model("UserReleaseStatus", userReleaseStatusSchema);
