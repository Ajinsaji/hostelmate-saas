const express = require("express");

const router = express.Router();

const {
  createRequest,
  checkRequestStatus,
  cancelRequest,
  deleteRequest,
  lookupPincode,
} = require("../controllers/requestController");

const { uploadFields } = require("../middleware/cloudinaryUpload");

// PINCODE AUTO-LOOKUP (PUBLIC)
router.get("/pincode/:pincode", lookupPincode);

// REGISTER
router.post(
  "/register",
  uploadFields([
    {
      name: "aadhaarFile",
      maxCount: 1,
    },
    {
      name: "aadhaarBack",
      maxCount: 1,
    },
    {
      name: "ownerPhoto",
      maxCount: 1,
    },
    {
      name: "selfie",
      maxCount: 1,
    },
    {
      name: "licensePhoto",
      maxCount: 1,
    },
  ]),
  createRequest
);

// OWNER STATUS (GET)
router.get("/status/:phone", checkRequestStatus);



const { requireRole } = require("../middleware/auth");

// CANCEL REQUEST (Public user self-cancellation for pending requests)
router.delete("/cancel/:id", cancelRequest);

// DELETE REQUEST (permanent - admin only)
const adminGuard = requireRole(["super_admin", "admin"]);
router.delete("/:id", adminGuard, deleteRequest);

module.exports = router;


