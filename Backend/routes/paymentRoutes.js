const express = require("express");

const router = express.Router();

const multer = require("multer");

const {
  createPayment,
  getPaymentsByHostel,
  verifyPayment,
  getResidentPayments,
  deletePayment,
} = require("../controllers/paymentController");


// ==========================
// MULTER STORAGE
// ==========================

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(null, "uploads");
    },

    filename: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        Date.now() +
          "-" +
          file.originalname
      );
    },
  });

const upload = multer({
  storage,
});


// ==========================
// CREATE PAYMENT
// ==========================

router.post(
  "/create",

  upload.single("proof"),

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