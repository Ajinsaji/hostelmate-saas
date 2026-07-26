const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const {
  createVoucher,
  processPayment,
  getVouchers,
  getStatement,
  getAgeingReport,
} = require("../controllers/accountsPayableController");

router.use(ownerAuth);

router.post("/vouchers", createVoucher);
router.get("/vouchers", getVouchers);
router.post("/vouchers/:id/process-payment", processPayment);
router.get("/statement/:vendorId", getStatement);
router.get("/ageing-report", getAgeingReport);

module.exports = router;
