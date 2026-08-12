const express = require("express");
const router = express.Router();
const { getPublicHostel, submitAdmission } = require("../controllers/publicController");
const { uploadFields } = require("../middleware/cloudinaryUpload");


const { forgotPassword, resetPasswordWithToken } = require("../controllers/ownerController");

router.get("/hostel/:uniqueCode", getPublicHostel);

router.post("/hostel/:uniqueCode/admission", uploadFields([
  { name: "photoFile" },
  { name: "idProofFile" },
  { name: "signatureFile" }
]), submitAdmission);

// Public owner self-service password reset
router.post("/owner/forgot-password", forgotPassword);
router.post("/owner/reset-password", resetPasswordWithToken);

module.exports = router;
