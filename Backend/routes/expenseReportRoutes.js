const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { getDashboardStats, exportExpensesExcel } = require("../controllers/expenseReportController");

router.use(ownerAuth);

router.get("/dashboard", getDashboardStats);
router.get("/export/excel", exportExpensesExcel);

module.exports = router;
