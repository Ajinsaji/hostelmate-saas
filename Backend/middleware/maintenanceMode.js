const SystemSetting = require("../models/SystemSetting");

const maintenanceModeMiddleware = async (req, res, next) => {
  try {
    // Exempt admin API routes, admin login, public request tracking, health endpoints
    const path = req.path || req.originalUrl || "";
    if (
      path.startsWith("/api/admin") ||
      path.startsWith("/api/auth/admin") ||
      path.includes("/admin/") ||
      path.startsWith("/api/request/status") ||
      path.startsWith("/api/request/pincode") ||
      path.startsWith("/api/health") ||
      path === "/health"
    ) {
      return next();
    }

    // Check system settings
    const settings = await SystemSetting.findOne().lean();
    if (settings && settings.maintenanceMode) {
      return res.status(503).json({
        success: false,
        maintenanceMode: true,
        message:
          settings.maintenanceMessage ||
          "HostelMate platform is currently under maintenance. Please try again later.",
      });
    }
  } catch (err) {
    // Fail-open to prevent locking users if DB check fails
  }
  next();
};

module.exports = maintenanceModeMiddleware;
