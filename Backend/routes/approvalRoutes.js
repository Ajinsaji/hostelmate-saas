const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/auth");

const { 
  checkHostelRequestApproval,
  approveOnboardingRequest,
  rejectOnboardingRequest,
  assignOnboardingRequest
} = require("../controllers/approvalController");

// Public lightweight check for pending-approval UX.
// Query by phone (primary) and/or email (secondary, if available in future).
router.get("/check-approval-status", checkHostelRequestApproval);

// Admin-only approval & workflow management actions
const adminGuard = requireRole(["super_admin", "admin"]);
router.post("/approve/:id", adminGuard, approveOnboardingRequest);
router.post("/reject/:id", adminGuard, rejectOnboardingRequest);
router.post("/assign/:id", adminGuard, assignOnboardingRequest);

module.exports = router;

