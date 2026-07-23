const express = require("express");
const router = express.Router();
const { getCommunications } = require("../controllers/communicationController");
const adminAuth = require("../middleware/adminAuth");

router.get("/", adminAuth, getCommunications);

module.exports = router;
