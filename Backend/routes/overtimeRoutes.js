const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { auth } = require("../middleware/auth");
const rolePermissionMiddleware = require("../middleware/rolePermissionMiddleware");
const {
  createOvertimeRequest,
  getOvertimeRequests,
  approveOvertime,
  rejectOvertime,
} = require("../controllers/overtimeController");

router.post("/", auth, createOvertimeRequest);
router.get("/", auth, getOvertimeRequests);
router.patch("/:id/approve", ownerAuth, rolePermissionMiddleware("staff", "edit"), approveOvertime);
router.patch("/:id/reject", ownerAuth, rolePermissionMiddleware("staff", "edit"), rejectOvertime);

module.exports = router;
