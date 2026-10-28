const express = require("express");
const router = express.Router();
const accountantAuth = require("../middleware/accountantAuth");
const { createRentPlan, getRentPlans, updateRentPlan } = require("../controllers/rentPlanController");

router.use(accountantAuth);

router.post("/", createRentPlan);
router.get("/", getRentPlans);
router.put("/:id", updateRentPlan);

module.exports = router;
