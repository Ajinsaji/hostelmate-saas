const express = require("express");

const router = express.Router();

const {

  getDashboardStats,

  getAllRequests,

  approveHostel,

  rejectRequest,

  getAllHostels,

  deleteHostel,

  updateSubscription,

  getSubscriptions,

  addHostel,
  resendWhatsApp,
  resetOwnerTempPassword,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
} = require(
  "../controllers/adminController"
);

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

// ==========================
// DASHBOARD
// ==========================

router.get(
  "/dashboard",

  getDashboardStats
);


// ==========================
// REQUESTS
// ==========================

// GET ALL REQUESTS
router.get(
  "/requests",

  getAllRequests
);


// APPROVE
router.put(
  "/approve/:id",

  approveHostel
);


// REJECT
router.put(
  "/reject/:id",

  rejectRequest
);


// ==========================
// HOSTELS
// ==========================

// GET ALL HOSTELS
router.get(
  "/hostels",

  getAllHostels
);


// DELETE HOSTEL
router.delete(
  "/hostels/delete/:id",

  deleteHostel
);

// RESEND WHATSAPP
router.post(
  "/hostels/:ownerId/resend-whatsapp",
  resendWhatsApp
);

// RESET TEMP PASSWORD
router.put(
  "/hostels/:ownerId/reset-password",
  resetOwnerTempPassword
);

// ==========================
// SUBSCRIPTIONS
// ==========================

// GET ALL SUBSCRIPTIONS
router.get(
  "/subscriptions",

  getSubscriptions
);


// UPDATE SUBSCRIPTION
router.put(
  "/subscription/update/:id",
  updateSubscription
);

// ADD HOSTEL (SUPERADMIN)
router.post(
  "/hostels/add",
  upload.fields([
    { name: "aadhaarFile" },
    { name: "ownerPhoto" },
    { name: "licensePhoto" },
  ]),
  addHostel
);

// ==========================
// ADMIN PROFILE
// ==========================

// GET PROFILE
router.get(
  "/profile",
  getAdminProfile
);

// UPDATE PROFILE
router.put(
  "/profile/update",
  updateAdminProfile
);

// CHANGE PASSWORD
router.put(
  "/profile/change-password",
  changeAdminPassword
);

module.exports = router;
