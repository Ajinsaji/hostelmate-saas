const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const Invoice = require("../models/Invoice");
const Hostel = require("../models/Hostel");
const Owner = require("../models/Owner");
const { logger } = require("../utils/logger");

const INVOICE_DIR = path.join(__dirname, "../uploads/invoices");
if (!fs.existsSync(INVOICE_DIR)) {
  fs.mkdirSync(INVOICE_DIR, { recursive: true });
}

/**
 * Generates and stores an immutable PDF invoice to disk, returning the file path
 */
async function generateInvoicePDF(invoiceId) {
  const invoice = await Invoice.findById(invoiceId).populate("hostelId");
  if (!invoice) throw new Error("Invoice not found");

  const filePath = path.join(INVOICE_DIR, `${invoice.invoiceNumber}.pdf`);

  // Serve stored PDF if it already exists (Immutable Storage Strategy)
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  const hostel = await Hostel.findById(invoice.hostelId);
  const owner = await Owner.findOne({ hostelId: invoice.hostelId, role: "owner" });

  const doc = new PDFDocument({ margin: 40 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // 1. Header
  doc.fontSize(22).fillColor("#081028").text("HOSTELMATE OS", { align: "left" });
  doc.fontSize(10).fillColor("#64748b").text("SaaS Hostel Management Platform", { align: "left" });
  doc.moveDown(1.5);

  // 2. Invoice Details Box
  doc.fontSize(16).fillColor("#0f172a").text(`TAX INVOICE: ${invoice.invoiceNumber}`, { align: "right" });
  doc.fontSize(10).fillColor("#475569").text(`Billing Date: ${new Date(invoice.billingDate).toLocaleDateString()}`, { align: "right" });
  doc.text(`Payment Status: ${invoice.paymentStatus.toUpperCase()}`, { align: "right" });
  doc.moveDown(1.5);

  // 3. Customer & Hostel Info
  doc.fontSize(11).fillColor("#0f172a").text("BILLED TO:", { underline: true });
  doc.fontSize(10).fillColor("#334155");
  doc.text(`Hostel Name: ${hostel?.hostelName || "N/A"}`);
  doc.text(`Owner Name: ${hostel?.ownerName || owner?.name || "N/A"}`);
  doc.text(`Phone: ${hostel?.phone || owner?.phone || "N/A"}`);
  doc.text(`Address: ${hostel?.address || "N/A"}, ${hostel?.city || ""} ${hostel?.state || ""}`);
  doc.moveDown(2);

  // 4. Itemization Table
  doc.fontSize(11).fillColor("#0f172a").text("DESCRIPTION & BREAKDOWN", { underline: true });
  doc.moveDown(0.5);

  const subtotal = invoice.totalAmount;
  const gstAmount = Math.round((subtotal * 18) / 118); // Extracted GST component or 18% calculation
  const netPlan = invoice.planPrice || 0;
  const residentCharge = invoice.residentCharge || 0;

  doc.fontSize(10).fillColor("#334155");
  doc.text(`1. ${invoice.planName} Plan Platform Subscription:  INR ${netPlan.toFixed(2)}`);
  doc.text(`2. Active Resident Charges (${invoice.activeResidents} residents @ INR ${invoice.residentChargeRate}/head): INR ${residentCharge.toFixed(2)}`);
  doc.moveDown(1);

  doc.text("--------------------------------------------------------------------------------------------------");
  doc.text(`Subtotal:                    INR ${subtotal.toFixed(2)}`, { align: "right" });
  doc.text(`GST (18% Included):           INR ${gstAmount.toFixed(2)}`, { align: "right" });
  doc.fontSize(12).fillColor("#047857").text(`GRAND TOTAL:                 INR ${subtotal.toFixed(2)}`, { align: "right" });
  doc.fontSize(10).fillColor("#334155");
  doc.moveDown(2);

  // 5. Verification QR Code
  const qrDataStr = `HostelMate Invoice: ${invoice.invoiceNumber} | Total: INR ${invoice.totalAmount} | Status: ${invoice.paymentStatus}`;
  const qrDataUrl = await QRCode.toDataURL(qrDataStr);
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
  doc.image(qrBuffer, 40, doc.y, { width: 80 });

  doc.fontSize(9).fillColor("#94a3b8").text("This is an electronically generated tax invoice receipt for HostelMate SaaS.", 140, doc.y + 20);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
}

module.exports = {
  generateInvoicePDF,
};
