const InventoryItem = require("../models/InventoryItem");
const InventoryTransaction = require("../models/InventoryTransaction");
const mongoose = require("mongoose");
const { dispatchNotification } = require("./notificationCenterService");
const { logger } = require("../utils/logger");

async function createInventoryItem(data, userContext = {}) {
  const hostelId = userContext.hostelId;
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
  if (!hostelId) throw new Error("Hostel ID is required");
  return await InventoryItem.find({ hostelId }).sort({ itemName: 1 });
}

async function adjustInventoryStock(itemId, delta, remarks, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");
  if (!mongoose.Types.ObjectId.isValid(itemId)) throw new Error("Invalid inventory item ID");
  if (!Number.isFinite(delta) || delta === 0) throw new Error("Stock adjustment must be a non-zero number");

  const applyDelta = (session) => {
    const filter = { _id: itemId, hostelId };
    if (delta < 0) {
      filter.$expr = { $gte: [{ $add: ["$currentStock", delta] }, 0] };
    }
    const update = [{ $set: {
      currentStock: { $add: ["$currentStock", delta] },
      status: { $switch: {
        branches: [
          { case: { $lte: [{ $add: ["$currentStock", delta] }, 0] }, then: "Out of Stock" },
          { case: { $lte: [{ $add: ["$currentStock", delta] }, "$reorderLevel"] }, then: "Low Stock" },
        ],
        default: "In Stock",
      } },
    } }];
    return InventoryItem.findOneAndUpdate(filter, update, { new: true, session });
  };

  const topologyType = mongoose.connection?.client?.topology?.description?.type;
  const supportsTransactions = ["ReplicaSetNoPrimary", "ReplicaSetWithPrimary", "Sharded"].includes(topologyType);
  let session = null;
  let item = null;

  if (supportsTransactions) {
    session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        item = await applyDelta(session);
        if (!item) {
          const exists = await InventoryItem.exists({ _id: itemId, hostelId }).session(session);
          throw new Error(exists ? "Adjustment would make stock negative" : "Inventory item not found in this hostel");
        }
        await InventoryTransaction.create([{
          tenantId: hostelId,
          hostelId,
          inventoryItemId: item._id,
          transactionType: "Adjustment",
          quantity: delta,
          unitCost: item.averageCost,
          referenceType: "InventoryAdjustment",
          referenceId: item._id,
          remarks: remarks || "Stock adjustment",
        }], { session });
      });
      return item;
    } finally {
      await session.endSession();
    }
  }

  item = await applyDelta(null);
  if (!item) {
    const exists = await InventoryItem.exists({ _id: itemId, hostelId });
    throw new Error(exists ? "Adjustment would make stock negative" : "Inventory item not found in this hostel");
  }

  try {
    await InventoryTransaction.create({
      tenantId: hostelId,
      hostelId,
      inventoryItemId: item._id,
      transactionType: "Adjustment",
      quantity: delta,
      unitCost: item.averageCost,
      referenceType: "InventoryAdjustment",
      referenceId: item._id,
      remarks: remarks || "Stock adjustment",
    });
  } catch (error) {
    // Compensate on standalone MongoDB deployments if the audit write fails.
    const reverseDelta = -delta;
    const rollbackFilter = { _id: item._id, hostelId };
    if (reverseDelta < 0) {
      rollbackFilter.$expr = { $gte: [{ $add: ["$currentStock", reverseDelta] }, 0] };
    }
    await InventoryItem.updateOne(rollbackFilter, [{ $set: {
      currentStock: { $add: ["$currentStock", reverseDelta] },
      status: { $switch: {
        branches: [
          { case: { $lte: [{ $add: ["$currentStock", reverseDelta] }, 0] }, then: "Out of Stock" },
          { case: { $lte: [{ $add: ["$currentStock", reverseDelta] }, "$reorderLevel"] }, then: "Low Stock" },
        ],
        default: "In Stock",
      } },
    } }]);
    throw error;
  }
  return item;
}

/**
 * Scans inventory and dispatches low-stock notifications
 */
async function scanAndNotifyLowStock(hostelId) {
  const lowStockItems = await InventoryItem.find({
    hostelId,
    $expr: { $lte: ["$currentStock", "$reorderLevel"] },
  });

  if (!lowStockItems.length) return 0;

  const Hostel = require("../models/Hostel");
  const hostel = await Hostel.findById(hostelId).select("ownerId owner").lean();
  const ownerId = hostel?.ownerId || hostel?.owner;
  if (!ownerId) {
    logger.warn(`[Inventory] No owner found for hostel ${hostelId} - skipping notification dispatch`);
    return lowStockItems.length;
  }

  for (const item of lowStockItems) {
    try {
      await dispatchNotification({
        hostelId,
        recipientUserId: ownerId,
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
  adjustInventoryStock,
  scanAndNotifyLowStock,
};
