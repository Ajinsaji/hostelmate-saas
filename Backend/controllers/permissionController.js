const { getRolePermissions, updateRolePermissions } = require("../services/permissionService");
const { logger } = require("../utils/logger");

const getPermissions = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const permissions = await getRolePermissions(tenantId);
    return res.status(200).json({ success: true, permissions });
  } catch (error) {
    logger.error("GET PERMISSIONS ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to retrieve permissions", details: error.message });
  }
};

const updatePermissions = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const { role, permissions } = req.body || {};

    if (!role || !permissions) {
      return res.status(400).json({ success: false, message: "role and permissions payload are required" });
    }

    const updated = await updateRolePermissions(tenantId, role, permissions);
    return res.status(200).json({ success: true, message: `Permissions updated for ${role}`, permissions: updated });
  } catch (error) {
    logger.error("UPDATE PERMISSIONS ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Unable to update permissions" });
  }
};

module.exports = {
  getPermissions,
  updatePermissions,
};
