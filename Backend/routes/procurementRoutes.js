const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const {
  createRequisition,
  approveRequisition,
  convertToPO,
  receiveGoods,
  getRequisitions,
  getPurchaseOrders,
  submitInvoice,
  matchInvoice,
  getInvoices,
} = require("../controllers/procurementController");

router.use(ownerAuth);

router.post("/requisitions", createRequisition);
router.get("/requisitions", getRequisitions);
router.patch("/requisitions/:id/approve", approveRequisition);
router.post("/requisitions/:id/convert-po", convertToPO);
router.get("/orders", getPurchaseOrders);
router.post("/orders/:id/receive-goods", receiveGoods);

// 3-WAY MATCHING ENDPOINTS
router.post("/invoices", submitInvoice);
router.get("/invoices", getInvoices);
router.post("/invoices/:id/match", matchInvoice);

module.exports = router;

