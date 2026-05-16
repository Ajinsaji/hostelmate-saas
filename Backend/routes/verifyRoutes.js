const express = require("express");

const router = express.Router();

const { verifySession } = require("../controllers/sessionController");

// Session verification (owner/staff/admin)
router.get("/verify-session", verifySession);

module.exports = router;

