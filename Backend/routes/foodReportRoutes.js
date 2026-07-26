const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { getDashboardStats, exportKitchenExcel } = require("../controllers/foodReportController");

router.use(ownerAuth);

router.get("/dashboard", getDashboardStats);
router.get("/export/excel", exportKitchenExcel);

module.exports = router;
