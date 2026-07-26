const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { auth, requireRole } = require("../middleware/auth");
const { getPermissions, updatePermissions } = require("../controllers/permissionController");

router.get("/", auth, getPermissions);
router.put("/", ownerAuth, updatePermissions);

module.exports = router;
