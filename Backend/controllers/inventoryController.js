const inventoryService = require("../services/inventoryService");
const { createInventoryItemSchema } = require("../validations/foodValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createItem = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = createInventoryItemSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const item = await inventoryService.createInventoryItem(value, userCtx);
    return res.status(201).json({ success: true, message: "Inventory Item Created", item });
  } catch (err) {
    logger.error("createItem error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create item" });
  }
};

const getItems = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const items = await inventoryService.getInventoryItems(userCtx.hostelId);
    return res.status(200).json({ success: true, items });
  } catch (err) {
    logger.error("getItems error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const scanLowStock = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const alertCount = await inventoryService.scanAndNotifyLowStock(userCtx.hostelId);
    return res.status(200).json({ success: true, message: `Low stock scan complete (${alertCount} alerts)` });
  } catch (err) {
    logger.error("scanLowStock error:", err);
    return res.status(500).json({ success: false, message: err.message || "Scan error" });
  }
};

module.exports = {
  createItem,
  getItems,
  scanLowStock,
};
