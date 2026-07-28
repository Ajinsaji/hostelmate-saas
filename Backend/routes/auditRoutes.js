const express = require("express");
const router = express.Router();
const { getAuditLogs } = require("../controllers/auditController");
const { requireRole } = require("../middleware/auth");

/**
 * Audit Logs Route (Legacy stub - active endpoints hosted under /api/admin/audit-trails)
 */
router.get("/", requireRole(["super_admin", "admin"]), getAuditLogs);

module.exports = router;

