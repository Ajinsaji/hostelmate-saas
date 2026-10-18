const express = require("express");
const router = express.Router();
const kitchenAuth = require("../middleware/kitchenAuth");
const { recordAttendance, getAttendance } = require("../controllers/mealAttendanceController");

router.use(kitchenAuth);

router.post("/", recordAttendance);
router.get("/", getAttendance);

module.exports = router;
