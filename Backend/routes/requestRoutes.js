const express = require("express");

const router = express.Router();

const {
  createRequest,
  checkRequestStatus,
  cancelRequest,
  deleteRequest,
} = require("../controllers/requestController");


const { uploadFields } = require("../middleware/cloudinaryUpload");

// REGISTER
router.post(
  "/register",
  uploadFields([
    {
      name: "aadhaarFile",
      maxCount: 1,
    },
    {
      name: "ownerPhoto",
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

// SPEC-FORM API (GET)
router.get(
  "/hostel-request/status/:phone",
  checkRequestStatus
);


// CANCEL REQUEST
router.delete("/cancel/:id", cancelRequest);

// DELETE REQUEST (permanent)
router.delete("/:id", deleteRequest);

module.exports = router;


