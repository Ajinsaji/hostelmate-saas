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
      const paymentEntry = {
        amount,

        method,

        proof:
          req.file?.filename || "",

        verified: false,

        createdAt:
          new Date(),
      };

      // IF PAYMENT EXISTS
      if (payment) {
        payment.entries.push(
          paymentEntry
        );

        // CALCULATE TOTAL PAID
        const totalPaid =
          payment.entries.reduce(
            (sum, entry) =>
              sum +
              Number(
                entry.amount
              ),

            0
          );

        // UPDATE BALANCE
        payment.balance =
          totalRent -
          totalPaid;

        // UPDATE STATUS
        if (
          payment.balance <= 0
        ) {
          payment.status =
            "paid";
        } else {
          payment.status =
            "partial";
        }

        await payment.save();

        return res.status(200).json({
          success: true,
          message:
            "Partial Payment Added",
          payment,
        });
      }

      // CREATE NEW PAYMENT
      const newPayment =
        await Payment.create({
          hostelId,

          residentId,

          month,

          totalRent,

          entries: [
            paymentEntry,
          ],

          balance:
            totalRent -
            amount,

          status:
            amount >= totalRent
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
      console.log(error);

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
      const {
        paymentId,
        entryId,
      } = req.params;

      const payment =
        await Payment.findById(
          paymentId
        );

      if (!payment) {
        return res.status(404).json({
          success: false,
          message:
            "Payment not found",
        });
      }

      // FIND ENTRY
      const entry =
        payment.entries.id(
          entryId
        );

      if (!entry) {
        return res.status(404).json({
          success: false,
          message:
            "Payment entry not found",
        });
      }

      // VERIFY
      entry.verified =
        true;

      await payment.save();

      res.status(200).json({
        success: true,
        message:
          "Payment Verified",
      });
    } catch (error) {
      res.status(500).json(error);
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