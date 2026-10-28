const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/auth");
const contextMiddleware = require("../middleware/contextMiddleware");
const {
  enqueueJob,
  getJobs,
  getJobStats,
  retryJob,
  runWorkerCycleNow,
} = require("../controllers/jobController");

const ownerJobAuth = (req, res, next) => {
  const wrapper = requireRole(["super_admin", "admin", "eps_admin", "owner", "Owner", "owner_admin"]);
  wrapper(req, res, () => {
    if (req.user) {
      req.owner = {
        ownerId: req.user.userId,
        hostelId: req.user.hostelId || req.user.hostelID || req.user?.hostel?._id || null,
        role: req.user.role,
      };
    }
    contextMiddleware(req, res, next);
  });
};

router.use(ownerJobAuth);

router.post("/enqueue", enqueueJob);
router.get("/", getJobs);
router.get("/stats", getJobStats);
router.post("/:id/retry", retryJob);
router.post("/run-worker", runWorkerCycleNow);

module.exports = router;
