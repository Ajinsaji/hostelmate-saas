const express = require("express");
const router = express.Router();
const accountantAuth = require("../middleware/accountantAuth");
const { createExpense, getExpenses, updateStatus, deleteExpense } = require("../controllers/expenseController");

router.use(accountantAuth);

router.post("/", createExpense);
router.get("/", getExpenses);
router.patch("/:id/status", updateStatus);
router.delete("/:id", deleteExpense);

module.exports = router;
