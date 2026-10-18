const express = require("express");
const router = express.Router();
const accountantAuth = require("../middleware/accountantAuth");
const { recordPayment, getPayments, streamReceiptPDF } = require("../controllers/rentPaymentController");

router.use(accountantAuth);

router.post("/", recordPayment);
router.get("/", getPayments);
router.get("/:id/pdf", streamReceiptPDF);

module.exports = router;
