const express = require("express");

const router = express.Router();

const {
  createResident,
  getResidentsByHostel,
  getSingleResident,
  updateResident,
  checkoutResident,
  deleteResident,
} = require("../controllers/residentController");

const ownerAuth = require("../middleware/ownerAuth");
const { uploadFields } = require("../middleware/cloudinaryUpload");

// ==========================
// CREATE RESIDENT
// ==========================

router.post(
  "/create",
  ownerAuth,
  uploadFields([
    {
      name: "photo",
      maxCount: 1,
    },
    {
      name: "idProof",
      maxCount: 1,
    },
    {
      name: "signatureFile",
      maxCount: 1,
    },
  ]),
  createResident
);

// ==========================
// GET ALL RESIDENTS
// BY HOSTEL
// ==========================

router.get("/hostel", ownerAuth, getResidentsByHostel);

// ==========================
// GET SINGLE RESIDENT
// ==========================

router.get("/single/:residentId", getSingleResident);

// ==========================
// UPDATE RESIDENT
// ==========================

router.put(
  "/update/:residentId",
  ownerAuth,
  uploadFields([
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

router.put("/checkout/:residentId", checkoutResident);

// ==========================
// DELETE RESIDENT
// ==========================

router.delete("/delete/:residentId", deleteResident);

module.exports = router;

