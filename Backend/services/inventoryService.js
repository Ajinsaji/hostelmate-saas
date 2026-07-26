const InventoryItem = require("../models/InventoryItem");
const InventoryTransaction = require("../models/InventoryTransaction");
const { dispatchNotification } = require("./notificationCenterService");
const { logger } = require("../utils/logger");

async function createInventoryItem(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const item = await InventoryItem.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    createdBy: userContext.userId,
  });

  if (item.currentStock > 0) {
    await InventoryTransaction.create({
      tenantId: hostelId,
      hostelId,
      inventoryItemId: item._id,
      transactionType: "Opening Stock",
      quantity: item.currentStock,
      unitCost: item.averageCost,
      remarks: "Opening Stock Entry",
    });
  }

  return item;
}

async function getInventoryItems(hostelId) {
  return await InventoryItem.find({ hostelId }).sort({ itemName: 1 });
}

/**
 * Scans inventory and dispatches low-stock notifications
 */
async function scanAndNotifyLowStock(hostelId) {
  const lowStockItems = await InventoryItem.find({
    hostelId,
    $expr: { $lte: ["$currentStock", "$reorderLevel"] },
  });

  for (const item of lowStockItems) {
    try {
      await dispatchNotification({
        hostelId,
        type: "Maintenance Alert",
        title: `Low Stock Alert: ${item.itemName}`,
        message: `Inventory item ${item.itemName} stock is low (${item.currentStock} ${item.unit} remaining). Reorder level: ${item.reorderLevel} ${item.unit}.`,
        priority: "High",
        recipientType: "Owner",
        referenceType: "InventoryItem",
        referenceId: item._id,
      });
    } catch (nErr) {
      logger.error(`Error dispatching low stock alert for ${item.itemName}:`, nErr);
    }
  }

  return lowStockItems.length;
}

module.exports = {
  createInventoryItem,
  getInventoryItems,
  scanAndNotifyLowStock,
};
