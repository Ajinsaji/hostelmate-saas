const express = require("express");

const router = express.Router();

const ownerAuth = require("../middleware/ownerAuth");

const {
  createPayment,
  getPaymentsByHostel,
  verifyPayment,
  getResidentPayments,
  deletePayment,
} = require("../controllers/paymentController");

const { uploadSingle } = require("../middleware/cloudinaryUpload");
const trackStorageUpload = require("../middleware/storageTracker");

// ==========================
// CREATE PAYMENT
// ==========================

router.post(
  "/create",
  ownerAuth,
  uploadSingle("proof"),
  trackStorageUpload("receipts"),
  createPayment
);


// ==========================
// GET ALL PAYMENTS
// BY HOSTEL
// ==========================

router.get(
  "/hostel",
  ownerAuth,
  getPaymentsByHostel
);





// ==========================
// GET SINGLE RESIDENT
// PAYMENTS
// ==========================

router.get(
  "/resident/:residentId",
  ownerAuth,
  getResidentPayments
);


// ==========================
// VERIFY PAYMENT
// ==========================

router.put(
  "/verify/:paymentId/:entryId",
  ownerAuth,

  verifyPayment
);


// ==========================
// DELETE PAYMENT
// OPTIONAL
// ==========================

router.delete(
  "/delete/:paymentId",
  ownerAuth,

  deletePayment
);

module.exports = router;
