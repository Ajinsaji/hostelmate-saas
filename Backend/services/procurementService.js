const PurchaseRequisition = require("../models/PurchaseRequisition");
const PurchaseOrder = require("../models/PurchaseOrder");
const GoodsReceipt = require("../models/GoodsReceipt");
const InventoryItem = require("../models/InventoryItem");
const InventoryTransaction = require("../models/InventoryTransaction");
const ExpenseCategory = require("../models/ExpenseCategory");
const { createExpense } = require("./expenseService");
const { logger } = require("../utils/logger");

async function generateDocNumber(hostelId, prefix, model) {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = await model.countDocuments({ hostelId });
  const seq = String(count + 1).padStart(4, "0");
  return `${prefix}-${ym}-${seq}`;
}

async function createRequisition(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const requisitionNumber = await generateDocNumber(hostelId, "REQ", PurchaseRequisition);

  const req = await PurchaseRequisition.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    requisitionNumber,
    requestedBy: userContext.userId || null,
    status: "Submitted",
  });

  return req;
}

async function approveRequisition(requisitionId, userContext = {}) {
  const req = await PurchaseRequisition.findById(requisitionId);
  if (!req) throw new Error("Requisition not found");

  req.status = "Approved";
  req.approvedBy = userContext.userId || null;
  req.approvedDate = new Date();
  await req.save();

  return req;
}

async function convertRequisitionToPO({ requisitionId, vendorId, expectedDelivery }, userContext = {}) {
  const req = await PurchaseRequisition.findById(requisitionId);
  if (!req) throw new Error("Requisition not found");
  if (req.status !== "Approved") throw new Error("Only approved requisitions can be converted to Purchase Orders");

  const orderNumber = await generateDocNumber(req.hostelId, "PO", PurchaseOrder);

  // Map requisition items to PO items
  let totalAmount = 0;
  const poItems = [];
  for (const it of req.items) {
    const item = await InventoryItem.findById(it.inventoryItemId);
    const unitPrice = item ? item.averageCost || 10 : 10;
    const itemTotal = (it.quantity || 1) * unitPrice;
    totalAmount += itemTotal;

    poItems.push({
      inventoryItemId: it.inventoryItemId,
      quantity: it.quantity,
      unitPrice,
      totalAmount: itemTotal,
    });
  }

  const po = await PurchaseOrder.create({
    tenantId: req.hostelId,
    hostelId: req.hostelId,
    vendorId,
    purchaseRequisitionId: req._id,
    orderNumber,
    expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : new Date(Date.now() + 3 * 86400000),
    items: poItems,
    totalAmount,
    status: "Issued",
    createdBy: userContext.userId || null,
  });

  req.status = "Converted";
  await req.save();

  return po;
}

async function receiveGoods({ purchaseOrderId, receivedItems, remarks = "" }, userContext = {}) {
  const po = await PurchaseOrder.findById(purchaseOrderId);
  if (!po) throw new Error("Purchase Order not found");
  if (po.status === "Received") throw new Error("Goods have already been received for this Purchase Order");

  const receiptNumber = await generateDocNumber(po.hostelId, "GRN", GoodsReceipt);

  const itemsToReceive = Array.isArray(receivedItems) && receivedItems.length > 0 ? receivedItems : po.items.map((i) => ({
    inventoryItemId: i.inventoryItemId,
    quantityReceived: i.quantity,
    unitCost: i.unitPrice,
  }));

  const grn = await GoodsReceipt.create({
    tenantId: po.hostelId,
    hostelId: po.hostelId,
    purchaseOrderId: po._id,
    receiptNumber,
    receivedBy: userContext.userId || null,
    receivedItems: itemsToReceive,
    remarks,
  });

  // Update Inventory Item stock & create Purchase transaction records
  let totalReceivedValue = 0;
  for (const rItem of itemsToReceive) {
    const item = await InventoryItem.findById(rItem.inventoryItemId);
    if (item) {
      item.currentStock += rItem.quantityReceived;
      item.averageCost = rItem.unitCost;
      await item.save();

      const itemTotal = rItem.quantityReceived * rItem.unitCost;
      totalReceivedValue += itemTotal;

      await InventoryTransaction.create({
        tenantId: po.hostelId,
        hostelId: po.hostelId,
        inventoryItemId: item._id,
        transactionType: "Purchase",
        quantity: rItem.quantityReceived,
        unitCost: rItem.unitCost,
        referenceType: "GoodsReceipt",
        referenceId: grn._id,
        remarks: `Goods Receipt ${grn.receiptNumber} for PO ${po.orderNumber}`,
      });
    }
  }

  po.status = "Received";
  await po.save();

  // Create Operational Expense in Expense Management
  try {
    let foodCategory = await ExpenseCategory.findOne({ hostelId: po.hostelId, categoryCode: "FOOD" });
    if (!foodCategory) foodCategory = await ExpenseCategory.findOne({ hostelId: po.hostelId });

    if (foodCategory) {
      await createExpense(
        {
          hostelId: po.hostelId,
          categoryId: foodCategory._id,
          vendorId: po.vendorId,
          title: `Procurement PO #${po.orderNumber} (GRN #${grn.receiptNumber})`,
          amount: totalReceivedValue > 0 ? totalReceivedValue : po.totalAmount,
          paymentMethod: "Bank Transfer",
          status: "Paid",
          description: `Automated expense entry from Goods Receipt GRN #${grn.receiptNumber}`,
        },
        userContext
      );
    }
  } catch (expErr) {
    logger.error("Error creating operational expense for goods receipt:", expErr);
  }

  return grn;
}

async function getRequisitions(hostelId) {
  return await PurchaseRequisition.find({ hostelId })
    .populate("items.inventoryItemId", "itemName unit")
    .sort({ createdAt: -1 });
}

async function getPurchaseOrders(hostelId) {
  return await PurchaseOrder.find({ hostelId })
    .populate("vendorId", "vendorName phone")
    .populate("items.inventoryItemId", "itemName unit")
    .sort({ createdAt: -1 });
}

module.exports = {
  createRequisition,
  approveRequisition,
  convertRequisitionToPO,
  receiveGoods,
  getRequisitions,
  getPurchaseOrders,
};
