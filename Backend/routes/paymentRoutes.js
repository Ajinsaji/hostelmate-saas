const express = require("express");

const router = express.Router();

const {
  createPayment,
  getPaymentsByHostel,
  verifyPayment,
  getResidentPayments,
  deletePayment,
} = require("../controllers/paymentController");

const { uploadSingle } = require("../middleware/cloudinaryUpload");




// ==========================
// CREATE PAYMENT
// ==========================

router.post(
  "/create",
  uploadSingle("proof"),
  createPayment
);


// ==========================
// GET ALL PAYMENTS
// BY HOSTEL
// ==========================

const ownerAuth = require("../middleware/ownerAuth");

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

  getResidentPayments
);


// ==========================
// VERIFY PAYMENT
// ==========================

router.put(
  "/verify/:paymentId/:entryId",

  verifyPayment
);


// ==========================
// DELETE PAYMENT
// OPTIONAL
// ==========================

router.delete(
  "/delete/:paymentId",

  deletePayment
);

module.exports = router;