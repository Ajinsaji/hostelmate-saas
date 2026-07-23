const express = require("express");
const router = express.Router();

const { 
  checkHostelRequestApproval,
  approveOnboardingRequest,
  rejectOnboardingRequest,
  assignOnboardingRequest
} = require("../controllers/approvalController");

// Public lightweight check for pending-approval UX.
// Query by phone (primary) and/or email (secondary, if available in future).
router.get("/check-approval-status", checkHostelRequestApproval);

router.post("/approve/:id", approveOnboardingRequest);
router.post("/reject/:id", rejectOnboardingRequest);
router.post("/assign/:id", assignOnboardingRequest);

module.exports = router;

