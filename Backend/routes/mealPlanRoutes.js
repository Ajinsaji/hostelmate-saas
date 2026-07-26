const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { createMealPlan, getMealPlans } = require("../controllers/mealPlanController");

router.use(ownerAuth);

router.post("/", createMealPlan);
router.get("/", getMealPlans);

module.exports = router;
