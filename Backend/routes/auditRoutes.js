const express = require("express");
const router = express.Router();
const { getAuditLogs } = require("../controllers/auditController");
const adminAuth = require("../middleware/adminAuth");

router.get("/", adminAuth, getAuditLogs);

module.exports = router;
