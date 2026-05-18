const express = require("express");
const router = express.Router();

const { checkHostelRequestApproval } = require("../controllers/approvalController");

// Public lightweight check for pending-approval UX.
// Query by phone (primary) and/or email (secondary, if available in future).
router.get("/check-approval-status", checkHostelRequestApproval);

module.exports = router;

