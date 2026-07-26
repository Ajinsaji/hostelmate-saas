const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { auth, requireRole } = require("../middleware/auth");
const { getPeriods, closePeriod, unlockPeriod } = require("../controllers/financialPeriodController");

router.get("/", ownerAuth, getPeriods);
router.post("/close", ownerAuth, closePeriod);
router.post("/unlock", auth, requireRole(["Admin", "SuperAdmin"]), unlockPeriod);

module.exports = router;
