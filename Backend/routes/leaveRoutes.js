const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { auth } = require("../middleware/auth");
const rolePermissionMiddleware = require("../middleware/rolePermissionMiddleware");
const {
  createLeaveRequest,
  getLeaves,
  approveLeave,
  rejectLeave,
  getMyLeaveBalances,
} = require("../controllers/leaveController");

router.get("/balance", auth, getMyLeaveBalances);

router.post("/", auth, createLeaveRequest);
router.get("/", auth, getLeaves);
router.patch("/:id/approve", ownerAuth, rolePermissionMiddleware("staff", "edit"), approveLeave);
router.patch("/:id/reject", ownerAuth, rolePermissionMiddleware("staff", "edit"), rejectLeave);

module.exports = router;
