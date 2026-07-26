const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { createRecurringRule, getRecurringExpenses } = require("../controllers/recurringExpenseController");

router.use(ownerAuth);

router.post("/", createRecurringRule);
router.get("/", getRecurringExpenses);

module.exports = router;
