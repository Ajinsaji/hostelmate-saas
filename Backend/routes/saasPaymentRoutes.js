const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
  retryPayment,
} = require("../controllers/saasPaymentController");

// Public Webhook route (HMAC verified inside controller)
router.post("/webhook", handleWebhook);

// Protected Owner Payment Routes
router.post("/create-order", ownerAuth, createOrder);
router.post("/verify", ownerAuth, verifyPayment);
router.get("/history", ownerAuth, getPaymentHistory);
router.post("/retry", ownerAuth, retryPayment);

module.exports = router;
