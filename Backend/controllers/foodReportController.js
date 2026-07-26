const foodCostService = require("../services/foodCostService");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const getDashboardStats = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const stats = await foodCostService.getKitchenDashboardStats(userCtx.hostelId);
    return res.status(200).json({ success: true, ...stats });
  } catch (err) {
    logger.error("getDashboardStats error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const exportKitchenExcel = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const buffer = await foodCostService.generateKitchenExcelReport(userCtx.hostelId);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=Kitchen_Purchases_Report.xlsx");
    return res.send(buffer);
  } catch (err) {
    logger.error("exportKitchenExcel error:", err);
    return res.status(500).json({ success: false, message: err.message || "Export error" });
  }
};

module.exports = {
  getDashboardStats,
  exportKitchenExcel,
};
