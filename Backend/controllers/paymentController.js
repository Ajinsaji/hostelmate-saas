const { logger } = require("../utils/logger");
const Payment = require("../models/Payment");

const Resident = require("../models/Resident");


// ==========================
// CREATE PAYMENT
// ==========================

const createPayment =
  async (req, res) => {
    try {
      const {
        residentId,
        month,
        amount,
        method,
        totalRent,
        paymentMethod,
        cashAmount,
        onlineAmount,
      } = req.body;

      const hostelId = req.owner?.hostelId;

      if (!hostelId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: missing hostelId from token",
        });
      }

      // FIND EXISTING MONTH PAYMENT
      let payment =
        await Payment.findOne({
          residentId,
          month,
        });

      // CREATE ENTRY
      // Preserve existing entry shape: { amount, method, proof, verified, createdAt }
      // Extend split fields on entry when method is partial
      const effectivePaymentMethod = paymentMethod || method;

      const getUploadedFileUrl = require("../utils/getUploadedFileUrl");

      const paymentEntry = {
        amount,
        method: effectivePaymentMethod,
        proof: getUploadedFileUrl(req.file) || "",
        verified: false,
        createdAt: new Date(),

        // optional split fields (safe if unused)
        ...(effectivePaymentMethod === "partial"
          ? {
              cashAmount: Number(cashAmount || 0),
              onlineAmount: Number(onlineAmount || 0),
            }
          : {}),
      };

      // IF PAYMENT EXISTS
      if (payment) {
        payment.entries.push(paymentEntry);

        // CALCULATE TOTAL PAID
        const totalPaid = payment.entries.reduce(
          (sum, entry) => sum + Number(entry.amount || 0),
          0
        );

        // Recompute balance using latest totalRent coming from this request.
        // This keeps UI consistent when owner edits totalRent for same month.
        payment.balance = Number(totalRent || 0) - totalPaid;

        // If this is a split payment, persist split amounts and paidAmount.
        // Otherwise keep existing behavior.
        if (effectivePaymentMethod === "partial") {
          const cashTotal = Number(payment.cashAmount || 0) + Number(cashAmount || 0);
          const onlineTotal = Number(payment.onlineAmount || 0) + Number(onlineAmount || 0);
          payment.cashAmount = cashTotal;
          payment.onlineAmount = onlineTotal;
          payment.paidAmount = cashTotal + onlineTotal;
        }

        // UPDATE BALANCE
        payment.balance = totalRent - totalPaid;

        // UPDATE STATUS
        if (payment.balance <= 0) {
          payment.status = "paid";
        } else {
          payment.status = "partial";
        }

        await payment.save();


      // Notification for this payment upload
      try {
        const { publishNotification } = require("../utils/notificationPublisher");
        const Owner = require("../models/Owner");
        const owner = await Owner.findOne({ hostelId: req.owner?.hostelId, role: "owner" });
        if (owner?._id) {
          await publishNotification({
            userId: owner._id,
            hostelId: req.owner?.hostelId,
            type: "payment_uploaded",
            message: "Payment uploaded",
            meta: { route: "/payments", paymentId: payment?._id || null, residentId: payment?.residentId || null },
          });
        }
      } catch (e) {
        logger.error("Payment notification failed:", e?.message || e);
      }

      res.status(200).json({
        success: true,
        message:
          "Partial Payment Added",
        payment,
      });

      }

      // CREATE NEW PAYMENT
      const effectivePaidAmount =
        effectivePaymentMethod === "partial"
          ? Number(cashAmount || 0) + Number(onlineAmount || 0)
          : Number(amount || 0);

      const newPayment = await Payment.create({
        hostelId,
        residentId,
        month,
        totalRent,
        entries: [paymentEntry],

        // Persist split fields when paymentMethod is partial
        ...(effectivePaymentMethod === "partial"
          ? {
              cashAmount: Number(cashAmount || 0),
              onlineAmount: Number(onlineAmount || 0),
              paidAmount: effectivePaidAmount,
            }
          : {}),

        balance: Number(totalRent || 0) - effectivePaidAmount,
        status:
          effectivePaidAmount >= Number(totalRent || 0)
            ? "paid"
            : "partial",
      });

      res.status(201).json({
        success: true,
        message:
          "Payment Created",
        payment:
          newPayment,
      });
    } catch (error) {
      logger.info(error);

      res.status(500).json(error);
    }
  };


// ==========================
// GET PAYMENTS
// BY HOSTEL
// ==========================

const getPaymentsByHostel =
  async (req, res) => {
    try {
      const payments =
        await Payment.find({
          hostelId: req.owner?.hostelId,
        }).populate(
          "residentId"
        );

      res.status(200).json({
        success: true,
        payments,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };


// ==========================
// GET RESIDENT PAYMENTS
// ==========================

const getResidentPayments =
  async (req, res) => {
    try {
      const payments =
        await Payment.find({
          residentId:
            req.params
              .residentId,
        });

      res.status(200).json({
        success: true,
        payments,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };


// ==========================
// VERIFY PAYMENT
// ==========================

const verifyPayment =
  async (req, res) => {
    try {
      const { paymentId, entryId } = req.params;

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      const entry = payment.entries.id(entryId);
      if (!entry) {
        return res.status(404).json({
          success: false,
          message: "Payment entry not found",
        });
      }

      // VERIFY
      entry.verified = true;

      // Recalculate totals/status to keep UI consistent
      const totalPaid = payment.entries.reduce(
        (sum, e) => sum + Number(e.amount || 0),
        0
      );
      payment.balance = Number(payment.totalRent || payment.balance + (payment.totalRent ? 0 : 0)) - totalPaid;
      // If totalRent exists in schema, prefer it; otherwise keep computed balance
      if (payment.totalRent !== undefined && payment.totalRent !== null) {
        payment.balance = payment.totalRent - totalPaid;
      }
      payment.status = payment.balance <= 0 ? "paid" : "partial";

      await payment.save();

      // NOTIFICATION: Payment verified
      try {
        const { publishNotification } = require("../utils/notificationPublisher");
        const Resident = require("../models/Resident");
        const Owner = require("../models/Owner");
        const resident = await Resident.findById(payment.residentId);
        const owner = await Owner.findOne({ hostelId: payment.hostelId, role: "owner" });
        if (owner?._id) {
          await publishNotification({
            userId: owner._id,
            hostelId: payment.hostelId,
            type: "payment_verified",
            title: `Payment Verified`,
            message: `Payment from ${resident?.name || "resident"} has been verified`,
            meta: { route: "/payments", paymentId: payment._id },
          });
        }
      } catch (e) {
        logger.error("Payment verified notification failed:", e?.message || e);
      }

      res.status(200).json({
        success: true,
        message: "Payment Verified",
        payment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to verify payment",
        details: error?.message || String(error),
      });
    }
  };


// ==========================
// DELETE PAYMENT
// ==========================

const deletePayment =
  async (req, res) => {
    try {
      await Payment.findByIdAndDelete(
        req.params.paymentId
      );

      res.status(200).json({
        success: true,
        message:
          "Payment Deleted",
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };

module.exports = {
  createPayment,

  getPaymentsByHostel,

  getResidentPayments,

  verifyPayment,

  deletePayment,
};
