const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { setCategoryBudget, getBudgets } = require("../controllers/budgetController");

router.use(ownerAuth);

router.post("/", setCategoryBudget);
router.get("/", getBudgets);

module.exports = router;
