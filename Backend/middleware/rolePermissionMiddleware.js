const { canAccessModule } = require("../services/permissionService");
const User = require("../models/User");
const Staff = require("../models/Staff");
const { logger } = require("../utils/logger");

const rolePermissionMiddleware = (moduleName, action = "view") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized access" });
      }

      const { id, userId, role, tenantId, hostelId } = req.user;
      const userRoleId = role ? role.toLowerCase() : "";

      if (userRoleId === "owner") {
        return next();
      }

      const activeUserId = userId || id;
      if (activeUserId) {
        const user = await User.findById(activeUserId);
        if (user && user.status === "Inactive") {
          return res.status(403).json({ success: false, message: "Account disabled by administrator" });
        }
      }

      // Check tenantId from user or fallback to hostelId
      const targetTenantId = tenantId || hostelId;

      const hasAccess = await canAccessModule(targetTenantId, role, moduleName, action);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Role '${role}' lacks permission for '${moduleName}' (${action})`,
        });
      }

      return next();
    } catch (error) {
      logger.error("ROLE PERMISSION MIDDLEWARE ERROR:", error?.message || error);
      return res.status(500).json({ success: false, message: "Permission check failed", details: error.message });
    }
  };
};

module.exports = rolePermissionMiddleware;
