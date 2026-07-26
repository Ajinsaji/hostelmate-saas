const rentPaymentService = require("../services/rentPaymentService");
const { generatePaymentReceiptPDF } = require("../services/pdfReceiptService");
const { recordPaymentSchema } = require("../validations/rentValidation");
const RentPayment = require("../models/RentPayment");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const recordPayment = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = recordPaymentSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const payment = await rentPaymentService.recordPayment(value, userCtx);
    return res.status(201).json({ success: true, message: "Payment Recorded Successfully", payment });
  } catch (err) {
    logger.error("recordPayment error:", err);
    return res.status(400).json({ success: false, message: err.message || "Payment recording failed" });
  }
};

const getPayments = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const result = await rentPaymentService.getPaymentsList({
      hostelId: userCtx.hostelId,
      residentId: req.query.residentId,
      invoiceId: req.query.invoiceId,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    logger.error("getPayments error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const streamReceiptPDF = async (req, res) => {
  try {
    const filePath = await generatePaymentReceiptPDF(req.params.id);
    const payment = await RentPayment.findById(req.params.id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${payment?.paymentNumber || "Receipt"}.pdf"`);
    return res.sendFile(filePath);
  } catch (err) {
    logger.error("streamReceiptPDF error:", err);
    return res.status(500).json({ success: false, message: err.message || "PDF generation error" });
  }
};

module.exports = {
  recordPayment,
  getPayments,
  streamReceiptPDF,
};
