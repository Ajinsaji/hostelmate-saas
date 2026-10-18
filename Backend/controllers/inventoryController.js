const inventoryService = require("../services/inventoryService");
const { createInventoryItemSchema, adjustInventoryStockSchema } = require("../validations/foodValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.context?.hostelId || req.owner?.hostelId || req.user?.hostelId,
    userId: req.context?.userId || req.owner?.ownerId || req.user?.userId || req.user?.id,
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
    if (!userCtx.hostelId) return res.status(400).json({ success: false, message: "Hostel context is required" });
    const items = await inventoryService.getInventoryItems(userCtx.hostelId);
    return res.status(200).json({ success: true, items });
  } catch (err) {
    logger.error("getItems error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const adjustStock = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    if (!userCtx.hostelId) return res.status(400).json({ success: false, message: "Hostel context is required" });
    const { error, value } = adjustInventoryStockSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const item = await inventoryService.adjustInventoryStock(req.params.itemId, value.delta, value.remarks, userCtx);
    return res.status(200).json({ success: true, message: "Inventory stock updated", item });
  } catch (err) {
    logger.error("adjustStock error:", err);
    const status = err.message === "Inventory item not found in this hostel" ? 404 : 400;
    return res.status(status).json({ success: false, message: err.message || "Failed to update stock" });
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
  adjustStock,
};
