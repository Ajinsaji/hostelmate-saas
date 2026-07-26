const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const {
  enqueueJob,
  getJobs,
  getJobStats,
  retryJob,
  runWorkerCycleNow,
} = require("../controllers/jobController");

router.use(ownerAuth);

router.post("/enqueue", enqueueJob);
router.get("/", getJobs);
router.get("/stats", getJobStats);
router.post("/:id/retry", retryJob);
router.post("/run-worker", runWorkerCycleNow);

module.exports = router;
