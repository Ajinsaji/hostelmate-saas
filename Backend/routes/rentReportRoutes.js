const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { getDashboardStats, exportPaymentsExcel } = require("../controllers/rentReportController");

router.use(ownerAuth);

router.get("/dashboard", getDashboardStats);
router.get("/export/excel", exportPaymentsExcel);

module.exports = router;
