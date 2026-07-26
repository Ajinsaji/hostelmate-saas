const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { recordWaste, getWasteLogs } = require("../controllers/wasteController");

router.use(ownerAuth);

router.post("/", recordWaste);
router.get("/", getWasteLogs);

module.exports = router;
