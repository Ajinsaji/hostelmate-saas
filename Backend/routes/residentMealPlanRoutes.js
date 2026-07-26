const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { assignMealPlan, getResidentPlan } = require("../controllers/residentMealPlanController");

router.use(ownerAuth);

router.post("/assign", assignMealPlan);
router.get("/:residentId", getResidentPlan);

module.exports = router;
