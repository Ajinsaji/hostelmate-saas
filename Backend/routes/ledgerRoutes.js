const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { getResidentLedger } = require("../controllers/ledgerController");

router.use(ownerAuth);

router.get("/:residentId", getResidentLedger);
router.get("/", getResidentLedger);

module.exports = router;
