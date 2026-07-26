const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const {
  getOwnerSubscriptionDashboard,
  getAvailablePlans,
  calculateUpgrade,
  processPayment,
  getOwnerInvoices,
  getInvoiceById,
  streamInvoicePDF,
} = require("../controllers/subscriptionController");

router.get("/subscription/dashboard", ownerAuth, getOwnerSubscriptionDashboard);
router.get("/subscription-status", ownerAuth, getOwnerSubscriptionDashboard); // Alias
router.get("/subscription/plans", ownerAuth, getAvailablePlans);
router.post("/subscription/calculate-upgrade", ownerAuth, calculateUpgrade);
router.post("/subscription/pay", ownerAuth, processPayment);
router.get("/subscription/invoices", ownerAuth, getOwnerInvoices);
router.get("/subscription/invoices/:id", ownerAuth, getInvoiceById);
router.get("/subscription/invoices/:id/pdf", ownerAuth, streamInvoicePDF);

module.exports = router;

