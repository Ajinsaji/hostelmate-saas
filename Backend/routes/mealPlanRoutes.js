const express = require("express");
const router = express.Router();
const kitchenAuth = require("../middleware/kitchenAuth");
const { createMealPlan, getMealPlans } = require("../controllers/mealPlanController");

router.use(kitchenAuth);

router.post("/", createMealPlan);
router.get("/", getMealPlans);

module.exports = router;
