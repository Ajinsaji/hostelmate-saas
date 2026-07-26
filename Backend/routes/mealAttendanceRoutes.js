const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { recordAttendance, getAttendance } = require("../controllers/mealAttendanceController");

router.use(ownerAuth);

router.post("/", recordAttendance);
router.get("/", getAttendance);

module.exports = router;
