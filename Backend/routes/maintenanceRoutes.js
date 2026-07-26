const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const {
  createMaintenanceLog,
  completeMaintenanceLog,
  getMaintenanceLogs,
} = require("../controllers/maintenanceController");

router.use(ownerAuth);

router.post("/", createMaintenanceLog);
router.get("/", getMaintenanceLogs);
router.patch("/:id/complete", completeMaintenanceLog);

module.exports = router;
