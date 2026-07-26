const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const {
  createBed,
  getBeds,
  getBedStatistics,
  reserveBed,
  releaseBed,
  setBedMaintenance,
  updateBed,
  deleteBed,
  restoreBed,
} = require("../controllers/bedController");

router.use(ownerAuth);

router.get("/statistics", getBedStatistics);

// Legacy alias `/room/:roomId`
router.get("/room/:roomId", (req, res, next) => {
  req.query.roomId = req.params.roomId;
  return getBeds(req, res, next);
});

router.post("/", createBed);
router.get("/", getBeds);
router.patch("/:id/reserve", reserveBed);
router.patch("/:id/release", releaseBed);
router.patch("/:id/maintenance", setBedMaintenance);
router.put("/:id", updateBed);
router.delete("/:id", deleteBed);
router.patch("/:id/restore", restoreBed);

module.exports = router;
