const analyticsReportService = require("../services/analyticsReportService");
const { logger } = require("../utils/logger");

const downloadReport = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const reportType = req.params.reportType || req.query.type || "executive";
    const format = req.query.format || "pdf";

    const report = await analyticsReportService.generateReport(tenantId, reportType, format);

    res.setHeader("Content-Type", report.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${report.filename}"`);

    return res.send(report.content);
  } catch (error) {
    logger.error("DOWNLOAD REPORT ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to generate report" });
  }
};

module.exports = {
  downloadReport,
};
