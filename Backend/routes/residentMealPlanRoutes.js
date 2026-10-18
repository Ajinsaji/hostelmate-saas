const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const {
  assignMealPlan,
  getResidentPlan,
  listResidentMealPlans,
  cancelResidentMealPlan,
} = require("../controllers/residentMealPlanController");

router.use(ownerAuth);

router.get("/", listResidentMealPlans);
router.post("/assign", assignMealPlan);
router.get("/:residentId", getResidentPlan);
router.patch("/:id/cancel", cancelResidentMealPlan);

module.exports = router;
