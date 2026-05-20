const express = require("express");

const router = express.Router();

const ownerAuth = require("../middleware/ownerAuth");
const { getSubscriptionStatus } = require("../controllers/subscriptionController");

// Lightweight owner dashboard gating
router.get("/subscription-status", ownerAuth, getSubscriptionStatus);

module.exports = router;

