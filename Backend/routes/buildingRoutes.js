const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const {
  createBuilding,
  getBuildings,
  getBuildingStatistics,
  updateBuilding,
  deleteBuilding,
  restoreBuilding,
} = require("../controllers/buildingController");

router.use(ownerAuth);

router.get("/statistics", getBuildingStatistics);
router.post("/", createBuilding);
router.get("/", getBuildings);
router.put("/:id", updateBuilding);
router.delete("/:id", deleteBuilding);
router.patch("/:id/restore", restoreBuilding);

module.exports = router;
