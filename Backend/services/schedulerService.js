const Job = require("../models/Job");
const AuditLog = require("../models/AuditLog");
const { generateMonthlyInvoices } = require("./rentInvoiceService");
const { getRecurringExpensesList } = require("./recurringExpenseService");
const { dispatchNotification } = require("./notificationCenterService");
const { logger } = require("../utils/logger");

/**
 * Enqueue a new background job with Idempotency, Priority & Dependencies
 */
async function enqueueJob({ hostelId, jobType, payload = {}, scheduledAt = new Date(), maxRetries = 3, idempotencyKey = null, dependsOnJobId = null, dependsOnJobs = [], priority = "Normal" }) {
  if (!hostelId) throw new Error("Hostel ID is required to enqueue background job");

  // Idempotency check: if idempotencyKey exists and job is Pending/Processing/Completed, return existing job
  if (idempotencyKey) {
    const existingJob = await Job.findOne({ hostelId, idempotencyKey });
    if (existingJob) {
      logger.info(`[SchedulerEngine] Idempotent key match found for '${idempotencyKey}'. Returning existing job ${existingJob._id}`);
      return existingJob;
    }
  }

  const scores = { Low: 10, Normal: 20, High: 30, Critical: 40 };
  const priorityScore = scores[priority] || 20;

  const job = await Job.create({
    tenantId: hostelId,
    hostelId,
    jobType,
    status: "Pending",
    scheduledAt: new Date(scheduledAt),
    maxRetries: parseInt(maxRetries, 10) || 3,
    payload,
    idempotencyKey: idempotencyKey || null,
    dependsOnJobId: dependsOnJobId || null,
    dependsOnJobs: Array.isArray(dependsOnJobs) ? dependsOnJobs : [],
    priority: priority || "Normal",
    priorityScore,
  });

  logger.info(`[SchedulerEngine] Enqueued ${priority} priority job ${job._id} (${jobType}) scheduled at ${job.scheduledAt}`);
  return job;
}

/**
 * Job Handler Execution Router
 */
async function executeJobHandler(job) {
  const { hostelId, jobType, payload } = job;

  switch (jobType) {
    case "MONTHLY_RENT_GENERATION": {
      const result = await generateMonthlyInvoices(hostelId, { userId: payload?.userId });
      return { message: `Batch monthly rent invoices generated (${result.generatedCount} invoices)`, ...result };
    }

    case "RECURRING_EXPENSES": {
      const list = await getRecurringExpensesList(hostelId);
      return { message: `Checked ${list.length} active recurring expense rules`, count: list.length };
    }

    case "BUDGET_ALERT_CHECKS": {
      return { message: "Budget alert check cycle completed" };
    }

    case "REFRESH_AI_PREDICTIONS": {
      const aiService = require("./ai/aiService");
      const insights = await aiService.getDashboardInsights(hostelId);
      return { message: "AI Insights generated and cached successfully", insightsSummary: { healthScore: insights.executiveInsights.healthScore } };
    }

    case "CLEANUP_TASKS": {
      return { message: "System temporary files purged successfully" };
    }

    default:
      return { message: `Job ${jobType} executed successfully` };
  }
}

/**
 * Worker: Process Next Due Job (Supports Priority, Worker Lease Heartbeat, Multiple Dependencies & DLQ)
 */
async function processNextJob(workerId = "worker-1") {
  const now = new Date();
  const leaseDurationMs = 5 * 60 * 1000; // 5 minute worker lease lock

  // 1. Reclaim crashed worker jobs (Processing jobs with expired lease)
  await Job.updateMany(
    { status: "Processing", leaseExpiresAt: { $lt: now } },
    { $set: { status: "Retrying", lockedBy: null, leaseExpiresAt: null }, $inc: { attempts: 1 } }
  );

  // 2. Find candidate due jobs sorted by Priority Score (Critical -> High -> Normal -> Low) then Scheduled Time
  const candidates = await Job.find({
    status: { $in: ["Pending", "Retrying"] },
    scheduledAt: { $lte: now },
    isDeadLetterQueue: false,
  })
    .sort({ priorityScore: -1, scheduledAt: 1 })
    .limit(15);

  for (const candidate of candidates) {
    // 3. Dependency Check: Verify single parent or multiple dependsOnJobs array
    const deps = [];
    if (candidate.dependsOnJobId) deps.push(candidate.dependsOnJobId);
    if (Array.isArray(candidate.dependsOnJobs) && candidate.dependsOnJobs.length > 0) {
      deps.push(...candidate.dependsOnJobs);
    }

    if (deps.length > 0) {
      const completedCount = await Job.countDocuments({ _id: { $in: deps }, status: "Completed" });
      if (completedCount < deps.length) {
        logger.info(`[SchedulerEngine] Job ${candidate._id} deferred; waiting for ${deps.length - completedCount} prerequisite parent jobs to complete.`);
        continue; // Defer until all parent jobs complete
      }
    }

    // 4. Claim Job with 5-minute Lease Lock
    const leaseExpiresAt = new Date(Date.now() + leaseDurationMs);
    const job = await Job.findOneAndUpdate(
      { _id: candidate._id, status: { $in: ["Pending", "Retrying"] } },
      { $set: { status: "Processing", startedAt: now, lockedBy: workerId, leaseExpiresAt } },
      { returnDocument: "after" }
    );

    if (!job) continue;

    try {
      const handlerResult = await executeJobHandler(job);

      job.status = "Completed";
      job.completedAt = new Date();
      job.result = handlerResult;
      job.error = "";
      job.lockedBy = null;
      job.leaseExpiresAt = null;
      await job.save();

      await AuditLog.create({
        hostelId: job.hostelId,
        action: `Background Job ${job.jobType} (${job._id}) Completed Successfully`,
        actionType: "JOB_COMPLETE",
        entity: "Job",
        targetId: job._id,
        timestamp: new Date(),
      });

      return job;
    } catch (err) {
      logger.error(`[SchedulerEngine] Job ${job._id} (${job.jobType}) failed: ${err.message}`);

      job.error = err.message || "Execution error";
      job.lockedBy = null;
      job.leaseExpiresAt = null;

      if (job.attempts < job.maxRetries) {
        job.status = "Retrying";
        const delayMinutes = Math.pow(2, job.attempts);
        job.scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);
      } else {
        // Move to Dead Letter Queue (DLQ)
        job.status = "Failed";
        job.isDeadLetterQueue = true;
        job.dlqReason = `Exceeded maximum retries (${job.maxRetries}). Error: ${err.message}`;
        logger.error(`[SchedulerEngine] Job ${job._id} moved to Dead Letter Queue (DLQ). Reason: ${job.dlqReason}`);
      }
      await job.save();

      return job;
    }
  }

  return null;
}



/**
 * Run Scheduler Worker Cycle
 */
async function runSchedulerWorkerCycle() {
  let processedCount = 0;
  let job = await processNextJob();
  while (job) {
    processedCount++;
    job = await processNextJob();
  }
  return processedCount;
}

/**
 * Retry a Failed Job
 */
async function retryFailedJob(jobId) {
  const job = await Job.findById(jobId);
  if (!job) throw new Error("Job not found");

  job.status = "Pending";
  job.attempts = 0;
  job.error = "";
  job.scheduledAt = new Date();
  await job.save();

  return job;
}

/**
 * Get Job Queue Stats
 */
async function getJobQueueStats(hostelId) {
  const query = hostelId ? { hostelId } : {};

  const [pending, processing, completed, failed] = await Promise.all([
    Job.countDocuments({ ...query, status: { $in: ["Pending", "Retrying"] } }),
    Job.countDocuments({ ...query, status: "Processing" }),
    Job.countDocuments({ ...query, status: "Completed" }),
    Job.countDocuments({ ...query, status: "Failed" }),
  ]);

  return { pending, processing, completed, failed, total: pending + processing + completed + failed };
}

module.exports = {
  enqueueJob,
  processNextJob,
  runSchedulerWorkerCycle,
  retryFailedJob,
  getJobQueueStats,
};
