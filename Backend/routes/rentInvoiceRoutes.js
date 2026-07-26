const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { createRentInvoice, generateMonthlyInvoices, getInvoices } = require("../controllers/rentInvoiceController");

router.use(ownerAuth);

router.post("/batch-generate", generateMonthlyInvoices);
router.post("/", createRentInvoice);
router.get("/", getInvoices);

module.exports = router;
