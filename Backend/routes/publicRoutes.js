const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const { getPublicHostel, submitAdmission } = require("../controllers/publicController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

router.get("/hostel/:uniqueCode", getPublicHostel);

router.post("/hostel/:uniqueCode/admission", upload.fields([
  { name: "photoFile" },
  { name: "idProofFile" },
  { name: "signatureFile" }
]), submitAdmission);

module.exports = router;
