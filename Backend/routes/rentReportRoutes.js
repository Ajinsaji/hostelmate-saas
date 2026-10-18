const express = require("express");
const router = express.Router();
const accountantAuth = require("../middleware/accountantAuth");
const { getDashboardStats, exportPaymentsExcel } = require("../controllers/rentReportController");

router.use(accountantAuth);

router.get("/dashboard", getDashboardStats);
router.get("/export/excel", exportPaymentsExcel);

module.exports = router;
