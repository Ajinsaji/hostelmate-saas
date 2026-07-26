const payrollService = require("../services/payrollService");
const payrollPolicyService = require("../services/payrollPolicyService");
const payrollAdjustmentService = require("../services/payrollAdjustmentService");
const Staff = require("../models/Staff");
const PayrollRecord = require("../models/PayrollRecord");
const Payslip = require("../models/Payslip");
const { logger } = require("../utils/logger");
const path = require("path");

const generatePayroll = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const hostelId = req.body.hostelId || req.user.hostelId || tenantId;
    const generatedBy = req.user.userId || req.user.id;
    const { month, year } = req.body;

    const result = await payrollService.generatePayroll(tenantId, hostelId, Number(month), Number(year), generatedBy);
    return res.status(200).json({ success: true, message: "Payroll generated successfully", ...result });
  } catch (error) {
    logger.error("GENERATE PAYROLL ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to generate payroll" });
  }
};

const getPayroll = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    const summary = await payrollService.getPayrollSummary(tenantId, month, year);
    return res.status(200).json({ success: true, ...summary });
  } catch (error) {
    logger.error("GET PAYROLL ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to load payroll" });
  }
};

const getPayrollById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const record = await PayrollRecord.findOne({ _id: req.params.id, tenantId }).populate({
      path: "staffId",
      select: "fullName employeeCode photo designation",
    });
    if (!record) {
      return res.status(404).json({ success: false, message: "Payroll record not found" });
    }
    return res.status(200).json({ success: true, payrollRecord: record });
  } catch (error) {
    logger.error("GET PAYROLL BY ID ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to fetch payroll record" });
  }
};

const approvePayroll = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const approvedBy = req.user.userId || req.user.id;
    const records = await payrollService.approvePayroll(tenantId, req.params.id, approvedBy);
    return res.status(200).json({ success: true, message: "Payroll approved", records });
  } catch (error) {
    logger.error("APPROVE PAYROLL ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to approve payroll" });
  }
};

const lockPayroll = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const lockedBy = req.user.userId || req.user.id;
    const period = await payrollService.lockPayroll(tenantId, req.params.id, lockedBy);
    return res.status(200).json({ success: true, message: "Payroll period locked", period });
  } catch (error) {
    logger.error("LOCK PAYROLL ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to lock payroll" });
  }
};

const paySalary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const paidBy = req.user.userId || req.user.id;
    const result = await payrollService.paySalary(tenantId, req.params.id, paidBy);
    return res.status(200).json({ success: true, message: "Salary paid & payslip generated", ...result });
  } catch (error) {
    logger.error("PAY SALARY CONTROLLER ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Salary payment failed" });
  }
};

const getMyPayroll = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const userId = req.user.userId || req.user.id;

    const staff = await Staff.findOne({ userId, isDeleted: false });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff record not found" });
    }

    const records = await PayrollRecord.find({ tenantId, staffId: staff._id }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, history: records });
  } catch (error) {
    logger.error("GET MY PAYROLL ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to load salary history" });
  }
};

const downloadPayslip = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const payslip = await Payslip.findOne({ payrollRecordId: req.params.id, tenantId });

    if (!payslip || !payslip.pdfUrl) {
      return res.status(404).json({ success: false, message: "Payslip document not found" });
    }

    payslip.downloadCount += 1;
    await payslip.save();

    const fullPath = path.join(__dirname, "..", payslip.pdfUrl);
    return res.download(fullPath);
  } catch (error) {
    logger.error("DOWNLOAD PAYSLIP ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to download payslip" });
  }
};

const getPolicy = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const policy = await payrollPolicyService.getActivePolicy(tenantId);
    return res.status(200).json({ success: true, policy });
  } catch (error) {
    logger.error("GET POLICY ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to load payroll policy" });
  }
};

const updatePolicy = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const updatedBy = req.user.userId || req.user.id;
    const policy = await payrollPolicyService.updatePolicy(tenantId, req.body, updatedBy);
    return res.status(200).json({ success: true, message: "Payroll policy updated", policy });
  } catch (error) {
    logger.error("UPDATE POLICY ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to update payroll policy" });
  }
};

const createAdjustment = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const createdBy = req.user.userId || req.user.id;
    const adjustment = await payrollAdjustmentService.createAdjustment(tenantId, req.body, createdBy);
    return res.status(201).json({ success: true, message: "Adjustment added", adjustment });
  } catch (error) {
    logger.error("CREATE ADJUSTMENT ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Failed to create payroll adjustment" });
  }
};

module.exports = {
  generatePayroll,
  getPayroll,
  getPayrollById,
  approvePayroll,
  lockPayroll,
  paySalary,
  getMyPayroll,
  downloadPayslip,
  getPolicy,
  updatePolicy,
  createAdjustment,
};
