const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const RentPayment = require("../models/RentPayment");
const RentInvoice = require("../models/RentInvoice");
const Resident = require("../models/Resident");
const Hostel = require("../models/Hostel");

const RECEIPTS_DIR = path.join(__dirname, "../uploads/receipts");
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

/**
 * Generates and caches an immutable PDF payment receipt
 */
async function generatePaymentReceiptPDF(paymentId) {
  const payment = await RentPayment.findById(paymentId)
    .populate("residentId")
    .populate("invoiceId");

  if (!payment) throw new Error("Payment record not found");

  const filePath = path.join(RECEIPTS_DIR, `${payment.paymentNumber}.pdf`);

  if (fs.existsSync(filePath)) {
    return filePath;
  }

  const hostel = await Hostel.findById(payment.hostelId);
  const resident = payment.residentId;
  const invoice = payment.invoiceId;

  const doc = new PDFDocument({ margin: 40 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // 1. Header
  doc.fontSize(20).fillColor("#081028").text("HOSTELMATE RENT RECEIPT", { align: "left" });
  doc.fontSize(10).fillColor("#64748b").text(hostel?.hostelName || "Hostel Operating System", { align: "left" });
  doc.moveDown(1.5);

  // 2. Receipt Info Box
  doc.fontSize(14).fillColor("#0f172a").text(`RECEIPT #: ${payment.paymentNumber}`, { align: "right" });
  doc.fontSize(10).fillColor("#475569").text(`Payment Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, { align: "right" });
  doc.text(`Payment Method: ${payment.paymentMethod}`, { align: "right" });
  doc.moveDown(1.5);

  // 3. Resident Details
  doc.fontSize(11).fillColor("#0f172a").text("RECEIVED FROM:", { underline: true });
  doc.fontSize(10).fillColor("#334155");
  doc.text(`Resident Name: ${resident?.fullName || resident?.name || "N/A"}`);
  doc.text(`Admission #: ${resident?.admissionNumber || "N/A"}`);
  doc.text(`Phone: ${resident?.phone || "N/A"}`);
  doc.moveDown(1.5);

  // 4. Breakdown Table
  doc.fontSize(11).fillColor("#0f172a").text("PAYMENT DETAILS", { underline: true });
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor("#334155");
  doc.text(`For Invoice #: ${invoice?.invoiceNumber || "Direct Payment"}`);
  doc.text(`Billing Period: ${invoice?.billingPeriod || "N/A"}`);
  doc.text(`Transaction Ref #: ${payment.transactionReference || "N/A"}`);
  doc.moveDown(1);

  doc.text("--------------------------------------------------------------------------------------------------");
  doc.fontSize(12).fillColor("#047857").text(`AMOUNT RECEIVED:           INR ${payment.amount.toFixed(2)}`, { align: "right" });
  if (invoice) {
    doc.fontSize(10).fillColor("#64748b").text(`Remaining Invoice Balance: INR ${invoice.balanceAmount.toFixed(2)}`, { align: "right" });
  }
  doc.moveDown(2);

  // 5. Verification QR Code
  const qrDataStr = `HostelMate Receipt: ${payment.paymentNumber} | Amount: INR ${payment.amount} | Resident: ${resident?.fullName}`;
  const qrDataUrl = await QRCode.toDataURL(qrDataStr);
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
  doc.image(qrBuffer, 40, doc.y, { width: 70 });

  doc.fontSize(8).fillColor("#94a3b8").text("This is an official computer-generated receipt for HostelMate Operating System.", 130, doc.y + 15);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
}

module.exports = {
  generatePaymentReceiptPDF,
};
