const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { createRentPlan, getRentPlans, updateRentPlan } = require("../controllers/rentPlanController");

router.use(ownerAuth);

router.post("/", createRentPlan);
router.get("/", getRentPlans);
router.put("/:id", updateRentPlan);

module.exports = router;
