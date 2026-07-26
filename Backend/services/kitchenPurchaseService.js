const KitchenPurchase = require("../models/KitchenPurchase");
const InventoryItem = require("../models/InventoryItem");
const InventoryTransaction = require("../models/InventoryTransaction");
const ExpenseCategory = require("../models/ExpenseCategory");
const { createExpense } = require("./expenseService");
const { logger } = require("../utils/logger");

async function recordKitchenPurchase(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  // Calculate total amount
  let totalAmount = 0;
  if (Array.isArray(data.items)) {
    data.items.forEach((it) => {
      it.totalAmount = (it.quantity || 0) * (it.unitPrice || 0);
      totalAmount += it.totalAmount;
    });
  }

  // 1. Create Purchase record
  const purchase = await KitchenPurchase.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    totalAmount,
    status: "Completed",
  });

  // 2. Increase Inventory items stock & record Purchase transactions
  if (Array.isArray(data.items)) {
    for (const it of data.items) {
      const item = await InventoryItem.findById(it.inventoryItemId);
      if (item) {
        item.currentStock += it.quantity;
        item.averageCost = it.unitPrice;
        await item.save();

        await InventoryTransaction.create({
          tenantId: hostelId,
          hostelId,
          inventoryItemId: item._id,
          transactionType: "Purchase",
          quantity: it.quantity,
          unitCost: it.unitPrice,
          referenceType: "KitchenPurchase",
          referenceId: purchase._id,
          remarks: `Purchase via Invoice ${purchase.invoiceNumber || purchase._id}`,
        });
      }
    }
  }

  // 3. Automatically create an operational expense entry in Expense Management
  try {
    let foodCategory = await ExpenseCategory.findOne({ hostelId, categoryCode: "FOOD" });
    if (!foodCategory) {
      foodCategory = await ExpenseCategory.findOne({ hostelId });
    }

    if (foodCategory) {
      const expense = await createExpense(
        {
          hostelId,
          categoryId: foodCategory._id,
          vendorId: purchase.vendorId,
          title: `Kitchen Purchase Invoice #${purchase.invoiceNumber || purchase._id}`,
          amount: totalAmount,
          paymentMethod: "UPI",
          status: "Paid",
          description: `Automated expense entry from Kitchen Purchase`,
        },
        userContext
      );

      purchase.expenseId = expense._id;
      await purchase.save();
    }
  } catch (expErr) {
    logger.error("Error creating expense for kitchen purchase:", expErr);
  }

  return purchase;
}

async function getKitchenPurchases(hostelId) {
  return await KitchenPurchase.find({ hostelId })
    .populate("vendorId", "vendorName phone")
    .populate("items.inventoryItemId", "itemName unit")
    .sort({ purchaseDate: -1 });
}

module.exports = {
  recordKitchenPurchase,
  getKitchenPurchases,
};
