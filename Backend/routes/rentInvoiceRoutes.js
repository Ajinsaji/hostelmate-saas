const express = require("express");
const router = express.Router();
const accountantAuth = require("../middleware/accountantAuth");
const { createRentInvoice, generateMonthlyInvoices, getInvoices } = require("../controllers/rentInvoiceController");

router.use(accountantAuth);

router.post("/batch-generate", generateMonthlyInvoices);
router.post("/", createRentInvoice);
router.get("/", getInvoices);

module.exports = router;
