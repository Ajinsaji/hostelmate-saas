const salaryStructureService = require("../services/salaryStructureService");
const { logger } = require("../utils/logger");

const createSalaryStructure = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const createdBy = req.user.userId || req.user.id;
    const structure = await salaryStructureService.createSalaryStructure(tenantId, req.body, createdBy);
    return res.status(201).json({ success: true, message: "Salary structure created", salaryStructure: structure });
  } catch (error) {
    logger.error("CREATE SALARY STRUCTURE ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to create salary structure" });
  }
};

const getSalaryStructure = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const { staffId } = req.query;
    const structure = await salaryStructureService.getSalaryStructure(tenantId, staffId);
    return res.status(200).json({ success: true, salaryStructure: structure });
  } catch (error) {
    logger.error("GET SALARY STRUCTURE ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to load salary structure" });
  }
};

module.exports = {
  createSalaryStructure,
  getSalaryStructure,
};
