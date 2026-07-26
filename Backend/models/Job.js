const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    jobType: {
      type: String,
      enum: [
        "MONTHLY_RENT_GENERATION",
        "RECURRING_EXPENSES",
        "BUDGET_ALERT_CHECKS",
        "REMINDER_PROCESSING",
        "NOTIFICATION_SCHEDULING",
        "PDF_GENERATION",
        "CLEANUP_TASKS",
        "REPORT_GENERATION",
        "DATABASE_BACKUP",
        "AI_ANALYSIS",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Failed", "Retrying"],
      default: "Pending",
    },
    scheduledAt: {
      type: Date,
      default: Date.now,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    error: {
      type: String,
      default: "",
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    idempotencyKey: {
      type: String,
      default: null,
    },
    dependsOnJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
    },
    dependsOnJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
    priority: {
      type: String,
      enum: ["Low", "Normal", "High", "Critical"],
      default: "Normal",
    },
    priorityScore: {
      type: Number,
      default: 20,
    },
    lockedBy: {
      type: String,
      default: null,
    },
    leaseExpiresAt: {
      type: Date,
      default: null,
    },
    isDeadLetterQueue: {
      type: Boolean,
      default: false,
    },
    dlqReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

jobSchema.pre("save", function (next) {
  const scores = { Low: 10, Normal: 20, High: 30, Critical: 40 };
  this.priorityScore = scores[this.priority] || 20;
  next();
});

jobSchema.index({ hostelId: 1, status: 1, priorityScore: -1, scheduledAt: 1 });
jobSchema.index({ hostelId: 1, idempotencyKey: 1 });
jobSchema.index({ hostelId: 1, isDeadLetterQueue: 1 });

module.exports = mongoose.model("Job", jobSchema);


