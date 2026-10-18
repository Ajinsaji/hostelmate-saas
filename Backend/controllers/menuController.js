const menuService = require("../services/menuService");
const { createMenuSchema } = require("../validations/foodValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.context?.hostelId || req.owner?.hostelId || req.user?.hostelId,
    userId: req.context?.userId || req.owner?.ownerId || req.user?.userId || req.user?.id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createOrUpdateMenu = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = createMenuSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const menu = await menuService.createOrUpdateMenu(value, userCtx);
    return res.status(200).json({ success: true, message: "Menu Saved & Published", menu });
  } catch (err) {
    logger.error("createOrUpdateMenu error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to save menu" });
  }
};

const getMenu = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    if (!userCtx.hostelId) return res.status(400).json({ success: false, message: "Hostel context is required" });
    if (req.query.date && Number.isNaN(new Date(req.query.date).getTime())) {
      return res.status(400).json({ success: false, message: "Invalid menu date" });
    }
    const menu = await menuService.getMenuForDate(userCtx.hostelId, req.query.date);
    return res.status(200).json({ success: true, menu });
  } catch (err) {
    logger.error("getMenu error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  createOrUpdateMenu,
  getMenu,
};
