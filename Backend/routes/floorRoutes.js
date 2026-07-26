const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const {
  createFloor,
  getFloors,
  getFloorStatistics,
  updateFloor,
  deleteFloor,
  restoreFloor,
} = require("../controllers/floorController");

router.use(ownerAuth);

router.get("/statistics", getFloorStatistics);
router.post("/", createFloor);
router.get("/", getFloors);
router.put("/:id", updateFloor);
router.delete("/:id", deleteFloor);
router.patch("/:id/restore", restoreFloor);

module.exports = router;
