const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { createExpense, getExpenses, updateStatus, deleteExpense } = require("../controllers/expenseController");

router.use(ownerAuth);

router.post("/", createExpense);
router.get("/", getExpenses);
router.patch("/:id/status", updateStatus);
router.delete("/:id", deleteExpense);

module.exports = router;
