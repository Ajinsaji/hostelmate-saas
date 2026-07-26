const rentInvoiceService = require("../services/rentInvoiceService");
const { createInvoiceSchema } = require("../validations/rentValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createRentInvoice = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = createInvoiceSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const invoice = await rentInvoiceService.createRentInvoice(value, userCtx);
    return res.status(201).json({ success: true, message: "Rent Invoice Generated", invoice });
  } catch (err) {
    logger.error("createRentInvoice error:", err);
    return res.status(400).json({ success: false, message: err.message || "Invoice creation failed" });
  }
};

const generateMonthlyInvoices = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const result = await rentInvoiceService.generateMonthlyInvoices(userCtx.hostelId, userCtx);
    return res.status(200).json({
      success: true,
      message: `Batch Monthly Invoices Generated (${result.generatedCount} new invoices)`,
      ...result,
    });
  } catch (err) {
    logger.error("generateMonthlyInvoices error:", err);
    return res.status(500).json({ success: false, message: err.message || "Batch generation failed" });
  }
};

const getInvoices = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const result = await rentInvoiceService.getInvoicesList({
      hostelId: userCtx.hostelId,
      residentId: req.query.residentId,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    logger.error("getInvoices error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  createRentInvoice,
  generateMonthlyInvoices,
  getInvoices,
};
