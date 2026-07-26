const VendorInvoice = require("../models/VendorInvoice");
const PurchaseOrder = require("../models/PurchaseOrder");
const GoodsReceipt = require("../models/GoodsReceipt");
const ExpenseCategory = require("../models/ExpenseCategory");
const { createExpense } = require("./expenseService");
const { logger } = require("../utils/logger");

async function submitVendorInvoice(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  // Check duplicate invoice number
  const existing = await VendorInvoice.findOne({ hostelId, invoiceNumber: data.invoiceNumber });
  if (existing) {
    throw new Error(`Vendor Invoice #${data.invoiceNumber} already exists in system`);
  }

  const invoice = await VendorInvoice.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    status: "Pending",
  });

  return invoice;
}

async function performThreeWayMatch(invoiceId, userContext = {}) {
  const invoice = await VendorInvoice.findById(invoiceId);
  if (!invoice) throw new Error("Vendor Invoice not found");

  const po = await PurchaseOrder.findById(invoice.purchaseOrderId);
  if (!po) throw new Error("Purchase Order not found");

  const grn = invoice.goodsReceiptId
    ? await GoodsReceipt.findById(invoice.goodsReceiptId)
    : await GoodsReceipt.findOne({ purchaseOrderId: po._id });

  if (!grn) {
    invoice.status = "Mismatch";
    invoice.matchResult = {
      isQtyMatched: false,
      isPriceMatched: false,
      isVendorMatched: false,
      discrepancyReason: "No corresponding Goods Receipt (GRN) found for Purchase Order",
    };
    await invoice.save();
    return invoice;
  }

  // 1. Vendor Match Check
  const isVendorMatched = String(po.vendorId) === String(invoice.vendorId);

  // 2. Quantity Match Check (Sum of PO item quantities vs GRN received quantities)
  const totalOrderedQty = po.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalReceivedQty = grn.receivedItems.reduce((sum, item) => sum + (item.quantityReceived || 0), 0);
  const isQtyMatched = totalOrderedQty === totalReceivedQty;

  // 3. Price Tolerance Check (Invoice amount vs PO totalAmount within 2% tolerance)
  const poAmount = po.totalAmount || 0;
  const invoiceAmount = invoice.amount || 0;
  const tolerance = poAmount * 0.02; // 2% price variance tolerance
  const isPriceMatched = Math.abs(invoiceAmount - poAmount) <= tolerance;

  const discrepancies = [];
  if (!isVendorMatched) discrepancies.push(`Vendor ID mismatch (PO: ${po.vendorId}, Invoice: ${invoice.vendorId})`);
  if (!isQtyMatched) discrepancies.push(`Quantity mismatch (Ordered: ${totalOrderedQty}, Received: ${totalReceivedQty})`);
  if (!isPriceMatched) discrepancies.push(`Price mismatch (PO: ₹${poAmount}, Invoice: ₹${invoiceAmount}, Diff: ₹${Math.abs(invoiceAmount - poAmount)})`);

  const isMatched = isVendorMatched && isQtyMatched && isPriceMatched;

  invoice.matchResult = {
    isQtyMatched,
    isPriceMatched,
    isVendorMatched,
    discrepancyReason: isMatched ? "All 3-way match rules passed cleanly" : discrepancies.join(" | "),
  };

  if (isMatched) {
    invoice.status = "Matched";
    invoice.goodsReceiptId = grn._id;

    // Automatically create Operational Expense on successful 3-way match
    try {
      let foodCategory = await ExpenseCategory.findOne({ hostelId: invoice.hostelId, categoryCode: "FOOD" });
      if (!foodCategory) foodCategory = await ExpenseCategory.findOne({ hostelId: invoice.hostelId });

      if (foodCategory) {
        await createExpense(
          {
            hostelId: invoice.hostelId,
            categoryId: foodCategory._id,
            vendorId: invoice.vendorId,
            title: `3-Way Matched Invoice #${invoice.invoiceNumber} (PO #${po.orderNumber})`,
            amount: invoice.amount,
            paymentMethod: "Bank Transfer",
            status: "Paid",
            description: `Automated expense entry from 3-Way Matched Vendor Invoice #${invoice.invoiceNumber}`,
          },
          userContext
        );
      }
    } catch (expErr) {
      logger.error("Error creating expense for 3-way matched invoice:", expErr);
    }
  } else {
    invoice.status = "Mismatch";
  }

  await invoice.save();
  return invoice;
}

async function getVendorInvoices(hostelId) {
  return await VendorInvoice.find({ hostelId })
    .populate("vendorId", "vendorName phone")
    .populate("purchaseOrderId", "orderNumber totalAmount")
    .sort({ createdAt: -1 });
}

module.exports = {
  submitVendorInvoice,
  performThreeWayMatch,
  getVendorInvoices,
};
