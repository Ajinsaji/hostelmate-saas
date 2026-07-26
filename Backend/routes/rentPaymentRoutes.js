const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { recordPayment, getPayments, streamReceiptPDF } = require("../controllers/rentPaymentController");

router.use(ownerAuth);

router.post("/", recordPayment);
router.get("/", getPayments);
router.get("/:id/pdf", streamReceiptPDF);

module.exports = router;
