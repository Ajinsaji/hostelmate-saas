const express = require("express");
const router = express.Router();
const accountantAuth = require("../middleware/accountantAuth");
const { getDashboardStats, exportExpensesExcel } = require("../controllers/expenseReportController");

router.use(accountantAuth);

router.get("/dashboard", getDashboardStats);
router.get("/export/excel", exportExpensesExcel);

module.exports = router;
