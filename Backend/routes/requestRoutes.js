const express = require("express");

const router = express.Router();

const multer = require("multer");

const {
  createRequest,
  checkRequestStatus,
} = require("../controllers/requestController");


const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// STORAGE
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


// REGISTER
router.post(
  "/register",

  upload.fields([
    {
      name: "aadhaarFile",
    },

    {
      name: "ownerPhoto",
    },

    {
      name: "licensePhoto",
    },
  ]),

  createRequest
);


// CHECK STATUS
router.get(
  "/status/:phone",

  checkRequestStatus
);

module.exports = router;