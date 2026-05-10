const express = require("express");

const router = express.Router();

const multer = require("multer");

const {
  createResident,
  getResidentsByHostel,
  getSingleResident,
  updateResident,
  checkoutResident,
  deleteResident,
} = require("../controllers/residentController");


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
// CREATE RESIDENT
// ==========================

router.post(
  "/create",

  upload.fields([
    {
      name: "photo",
      maxCount: 1,
    },

    {
      name: "idProof",
      maxCount: 1,
    },
  ]),

  createResident
);


// ==========================
// GET ALL RESIDENTS
// BY HOSTEL
// ==========================

const ownerAuth = require("../middleware/ownerAuth");

router.get(
  "/hostel",
  ownerAuth,
  getResidentsByHostel
);




// ==========================
// GET SINGLE RESIDENT
// ==========================

router.get(
  "/single/:residentId",

  getSingleResident
);


// ==========================
// UPDATE RESIDENT
// ==========================

router.put(
  "/update/:residentId",

  upload.fields([
    {
      name: "photo",
      maxCount: 1,
    },

    {
      name: "idProof",
      maxCount: 1,
    },
  ]),

  updateResident
);


// ==========================
// CHECKOUT RESIDENT
// ==========================

router.put(
  "/checkout/:residentId",

  checkoutResident
);


// ==========================
// DELETE RESIDENT
// ==========================

router.delete(
  "/delete/:residentId",

  deleteResident
);

module.exports = router;