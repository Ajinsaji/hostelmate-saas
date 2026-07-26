const procurementService = require("../services/procurementService");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId || req.body?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createRequisition = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const reqDoc = await procurementService.createRequisition(req.body, userCtx);
    return res.status(201).json({ success: true, message: "Purchase Requisition Submitted", requisition: reqDoc });
  } catch (err) {
    logger.error("createRequisition error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create requisition" });
  }
};

const approveRequisition = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const reqDoc = await procurementService.approveRequisition(req.params.id, userCtx);
    return res.status(200).json({ success: true, message: "Requisition Approved", requisition: reqDoc });
  } catch (err) {
    logger.error("approveRequisition error:", err);
    return res.status(400).json({ success: false, message: err.message || "Approval failed" });
  }
};

const convertToPO = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const po = await procurementService.convertRequisitionToPO(
      {
        requisitionId: req.params.id,
        vendorId: req.body.vendorId,
        expectedDelivery: req.body.expectedDelivery,
      },
      userCtx
    );
    return res.status(201).json({ success: true, message: "Purchase Order Issued", purchaseOrder: po });
  } catch (err) {
    logger.error("convertToPO error:", err);
    return res.status(400).json({ success: false, message: err.message || "PO conversion failed" });
  }
};

const receiveGoods = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const grn = await procurementService.receiveGoods(
      {
        purchaseOrderId: req.params.id,
        receivedItems: req.body.receivedItems,
        remarks: req.body.remarks,
      },
      userCtx
    );
    return res.status(200).json({ success: true, message: "Goods Received, Inventory Stock Incremented & Expense Created", goodsReceipt: grn });
  } catch (err) {
    logger.error("receiveGoods error:", err);
    return res.status(400).json({ success: false, message: err.message || "Goods receipt failed" });
  }
};

const getRequisitions = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const requisitions = await procurementService.getRequisitions(userCtx.hostelId);
    return res.status(200).json({ success: true, requisitions });
  } catch (err) {
    logger.error("getRequisitions error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const getPurchaseOrders = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const orders = await procurementService.getPurchaseOrders(userCtx.hostelId);
    return res.status(200).json({ success: true, orders });
  } catch (err) {
    logger.error("getPurchaseOrders error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const threeWayMatchService = require("../services/threeWayMatchService");

const submitInvoice = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const invoice = await threeWayMatchService.submitVendorInvoice(req.body, userCtx);
    return res.status(201).json({ success: true, message: "Vendor Invoice Submitted for 3-Way Match", invoice });
  } catch (err) {
    logger.error("submitInvoice error:", err);
    return res.status(400).json({ success: false, message: err.message || "Invoice submission failed" });
  }
};

const matchInvoice = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const invoice = await threeWayMatchService.performThreeWayMatch(req.params.id, userCtx);
    return res.status(200).json({ success: true, message: `3-Way Match Evaluation Complete (${invoice.status})`, invoice });
  } catch (err) {
    logger.error("matchInvoice error:", err);
    return res.status(400).json({ success: false, message: err.message || "Match evaluation failed" });
  }
};

const getInvoices = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const invoices = await threeWayMatchService.getVendorInvoices(userCtx.hostelId);
    return res.status(200).json({ success: true, invoices });
  } catch (err) {
    logger.error("getInvoices error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  createRequisition,
  approveRequisition,
  convertToPO,
  receiveGoods,
  getRequisitions,
  getPurchaseOrders,
  submitInvoice,
  matchInvoice,
  getInvoices,
};

