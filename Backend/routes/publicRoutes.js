const express = require("express");
const router = express.Router();
const { getPublicHostel, submitAdmission } = require("../controllers/publicController");
const { uploadFields } = require("../middleware/cloudinaryUpload");


router.get("/hostel/:uniqueCode", getPublicHostel);

router.post("/hostel/:uniqueCode/admission", uploadFields([
  { name: "photoFile" },
  { name: "idProofFile" },
  { name: "signatureFile" }
]), submitAdmission);

module.exports = router;
