const Payment = require("../models/Payment");
const Resident = require("../models/Resident");
const { Parser } = require("json2csv");
// const ExcelJS = require("exceljs");
// const PDFDocument = require("pdfkit");

/**
 * Helper to handle response formatting
 */
const sendReport = (res, data, format, filenamePrefix) => {
  if (format === "csv") {
    try {
      const parser = new Parser();
      const csv = parser.parse(data);
      res.header("Content-Type", "text/csv");
      res.attachment(`${filenamePrefix}-${Date.now()}.csv`);
      return res.send(csv);
    } catch (err) {
      return res.status(500).json({ success: false, message: "Error generating CSV" });
    }
  } 
  // Future implementations for PDF and Excel can go here
  else if (format === "pdf") {
    return res.status(501).json({ success: false, message: "PDF export not yet fully implemented" });
  } else if (format === "excel") {
    return res.status(501).json({ success: false, message: "Excel export not yet fully implemented" });
  }

  // Default to JSON
  return res.status(200).json({ success: true, data });
};

// GET /api/reports/revenue
const getRevenueReport = async (req, res) => {
  try {
    const { format = "json" } = req.query;
    const payments = await Payment.find({ status: "success" })
      .select("amount paidAmount paymentMethod transactionId createdAt residentId hostelId")
      .populate("residentId", "name phone")
      .lean();

    const data = payments.map((p) => ({
      ResidentName: p.residentId?.name || "N/A",
      Phone: p.residentId?.phone || "N/A",
      AmountDue: p.amount || 0,
      AmountPaid: p.paidAmount || 0,
      Method: p.paymentMethod || "N/A",
      TransactionID: p.transactionId || "N/A",
      Date: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : "N/A",
    }));

    return sendReport(res, data, format, "revenue-report");
  } catch (error) {
    console.error("Error generating revenue report:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/reports/residents
const getResidentReport = async (req, res) => {
  try {
    const { format = "json" } = req.query;
    const residents = await Resident.find({ status: "active" })
      .select("name phone email emergencyContact joinDate roomId")
      .populate("roomId", "roomNumber type rentPerBed")
      .lean();

    const data = residents.map((r) => ({
      Name: r.name,
      Phone: r.phone,
      Email: r.email,
      EmergencyContact: r.emergencyContact || "N/A",
      JoinDate: r.joinDate ? new Date(r.joinDate).toISOString().split('T')[0] : "N/A",
      RoomNumber: r.roomId?.roomNumber || "N/A",
      Rent: r.roomId?.rentPerBed || 0,
    }));

    return sendReport(res, data, format, "resident-report");
  } catch (error) {
    console.error("Error generating resident report:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getRevenueReport,
  getResidentReport,
};
