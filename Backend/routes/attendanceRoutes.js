const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { auth } = require("../middleware/auth");
const rolePermissionMiddleware = require("../middleware/rolePermissionMiddleware");
const {
  checkIn,
  checkOut,
  getAttendance,
  getAttendanceById,
  getMyAttendance,
  getAttendanceSummary,
  getAttendanceCalendar,
  submitAttendanceCorrection,
  getAttendanceCorrections,
  approveAttendanceCorrection,
  rejectAttendanceCorrection,
} = require("../controllers/attendanceController");

router.post("/check-in", auth, checkIn);
router.post("/check-out", auth, checkOut);
router.get("/me", auth, getMyAttendance);
router.get("/summary", auth, getAttendanceSummary);
router.get("/calendar", auth, getAttendanceCalendar);

router.post("/corrections", auth, submitAttendanceCorrection);
router.get("/corrections", auth, getAttendanceCorrections);
router.patch("/corrections/:id/approve", ownerAuth, rolePermissionMiddleware("staff", "edit"), approveAttendanceCorrection);
router.patch("/corrections/:id/reject", ownerAuth, rolePermissionMiddleware("staff", "edit"), rejectAttendanceCorrection);

router.get("/", auth, getAttendance);
router.get("/:id", auth, getAttendanceById);

module.exports = router;
