const express = require("express");
const router = express.Router();
const { getCommunications } = require("../controllers/communicationController");
const { requireRole } = require("../middleware/auth");

/**
 * Communication Console Route (Legacy stub - active endpoints hosted under /api/admin/communications)
 */
router.get("/", requireRole(["super_admin", "admin"]), getCommunications);

module.exports = router;

