const WasteLog = require("../models/WasteLog");
const InventoryItem = require("../models/InventoryItem");
const InventoryTransaction = require("../models/InventoryTransaction");
const { logger } = require("../utils/logger");

async function recordWasteLog(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const item = await InventoryItem.findById(data.inventoryItemId);
  if (!item) throw new Error("Inventory item not found");

  const costImpact = (data.quantity || 0) * (item.averageCost || 0);

  const waste = await WasteLog.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    costImpact,
    recordedBy: userContext.userId || null,
  });

  // Deduct stock from inventory
  item.currentStock = Math.max(0, item.currentStock - data.quantity);
  await item.save();

  await InventoryTransaction.create({
    tenantId: hostelId,
    hostelId,
    inventoryItemId: item._id,
    transactionType: "Waste",
    quantity: data.quantity,
    unitCost: item.averageCost,
    referenceType: "WasteLog",
    referenceId: waste._id,
    remarks: `Wastage logged (${data.reason})`,
  });

  return waste;
}

async function getWasteLogs(hostelId) {
  return await WasteLog.find({ hostelId })
    .populate("inventoryItemId", "itemName unit averageCost")
    .sort({ wasteDate: -1 });
}

module.exports = {
  recordWasteLog,
  getWasteLogs,
};
