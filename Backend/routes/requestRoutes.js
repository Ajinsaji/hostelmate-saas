const express = require("express");

const router = express.Router();

const {
  createRequest,
  checkRequestStatus,
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

// CHECK STATUS
router.get("/status/:phone", checkRequestStatus);

module.exports = router;

