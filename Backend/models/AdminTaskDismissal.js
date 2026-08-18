/**
 * AdminTaskDismissal
 *
 * Safe archival model for completed tasks dismissed from Today's Tasks view.
 *
 * Operational semantics:
 * - Dismissing a completed activity REMOVES it from the Today's Tasks "Completed Today" list.
 * - It does NOT delete the underlying Communication or AuditLog record.
 * - The permanent audit log remains searchable and intact.
 * - Financial / business records are never affected.
 */
const mongoose = require("mongoose");

const adminTaskDismissalSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    // Stable string identifier of the task (e.g. "audit_123", "done_wame_123", or Mongo ObjectId string)
    taskId: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional reference to underlying Communication document (if applicable)
    communicationId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Optional human-readable reason for the dismissal
    reason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    dismissedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // dismissedAt is our canonical timestamp
  }
);

// Unique per admin per taskId — prevents double dismissal
adminTaskDismissalSchema.index({ adminId: 1, taskId: 1 }, { unique: true });

// Fast lookup: which tasks has this admin dismissed?
adminTaskDismissalSchema.index({ adminId: 1, dismissedAt: -1 });

module.exports = mongoose.model("AdminTaskDismissal", adminTaskDismissalSchema);
