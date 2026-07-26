const schedulerService = require("../services/schedulerService");
const Job = require("../models/Job");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId || req.body?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const enqueueJob = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { jobType, payload, scheduledAt, maxRetries, idempotencyKey, dependsOnJobId, dependsOnJobs, priority } = req.body;
    if (!jobType) return res.status(400).json({ success: false, message: "jobType is required" });

    const job = await schedulerService.enqueueJob({
      hostelId: userCtx.hostelId,
      jobType,
      payload,
      scheduledAt,
      maxRetries,
      idempotencyKey,
      dependsOnJobId,
      dependsOnJobs,
      priority,
    });
    return res.status(201).json({ success: true, message: "Background Job Enqueued", job });
  } catch (err) {
    logger.error("enqueueJob error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to enqueue job" });
  }
};

const getJobs = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { hostelId: userCtx.hostelId };
    if (req.query.status) query.status = req.query.status;
    if (req.query.dlq === "true") query.isDeadLetterQueue = true;


    const [jobs, total] = await Promise.all([
      Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments(query),
    ]);

    return res.status(200).json({ success: true, jobs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error("getJobs error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const getJobStats = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const stats = await schedulerService.getJobQueueStats(userCtx.hostelId);
    return res.status(200).json({ success: true, stats });
  } catch (err) {
    logger.error("getJobStats error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const retryJob = async (req, res) => {
  try {
    const job = await schedulerService.retryFailedJob(req.params.id);
    return res.status(200).json({ success: true, message: "Job Re-queued for Retry", job });
  } catch (err) {
    logger.error("retryJob error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to retry job" });
  }
};

const runWorkerCycleNow = async (req, res) => {
  try {
    const processedCount = await schedulerService.runSchedulerWorkerCycle();
    return res.status(200).json({ success: true, message: `Worker cycle completed (${processedCount} jobs processed)` });
  } catch (err) {
    logger.error("runWorkerCycleNow error:", err);
    return res.status(500).json({ success: false, message: err.message || "Worker cycle error" });
  }
};

module.exports = {
  enqueueJob,
  getJobs,
  getJobStats,
  retryJob,
  runWorkerCycleNow,
};
