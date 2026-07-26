const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const adminAuth = require("../middleware/adminAuth");
const { getPeriods, closePeriod, unlockPeriod } = require("../controllers/financialPeriodController");

router.get("/", ownerAuth, getPeriods);
router.post("/close", ownerAuth, closePeriod);
router.post("/unlock", adminAuth, unlockPeriod);

module.exports = router;
