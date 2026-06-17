const express = require("express");

const router = express.Router();

const { requireRole } = require("../middleware/auth");

router.use(requireRole(["super_admin", "admin"]));

const {
  getDashboardStats,
  getAllRequests,
  approveHostel,
  rejectRequest,
  getAllHostels,
  getPendingHostels,
  deleteHostel,
  updateSubscription,
  getSubscriptions,
  addHostel,
  editHostelLocation,
  resendWhatsApp,
  resetOwnerTempPassword,
  getAdminProfile,
  updateAdminProfile,
  finalizeHostelActivation,
  changeAdminPassword,
  getSystemHealth,
} = require("../controllers/adminController");


const { uploadFields } = require("../middleware/cloudinaryUpload");

// ==========================
// DASHBOARD
// ==========================

router.get("/dashboard", getDashboardStats);

// ==========================
// SYSTEM HEALTH
// ==========================

router.get("/system-health", getSystemHealth);

// ==========================
// REQUESTS
// ==========================

router.get("/requests", getAllRequests);


router.put("/approve/:id", approveHostel);

router.put("/reject/:id", rejectRequest);

router.post(
  "/finalize-hostel-activation/:hostelId",
  finalizeHostelActivation
);


// ==========================
// HOSTELS
// ==========================

router.get("/hostels", getAllHostels);

router.get("/pending-hostels", getPendingHostels);

router.delete("/hostels/delete/:id", deleteHostel);

router.post("/hostels/:ownerId/resend-whatsapp", resendWhatsApp);

router.put("/hostels/:ownerId/reset-password", resetOwnerTempPassword);

// ==========================
// SUBSCRIPTIONS
// ==========================

router.get("/subscriptions", getSubscriptions);

router.put("/subscription/update/:id", updateSubscription);

// ADD HOSTEL (SUPERADMIN)
router.post(
  "/hostels/add",
  uploadFields([
    { name: "aadhaarFile", maxCount: 1 },
    { name: "ownerPhoto", maxCount: 1 },
    { name: "licensePhoto", maxCount: 1 },
  ]),
  addHostel
);

// EDIT HOSTEL (ADMIN)
router.put("/hostels/edit/:id", editHostelLocation);

// ==========================
// ADMIN PROFILE
// ==========================

router.get("/profile", getAdminProfile);

router.put("/profile/update", updateAdminProfile);

router.put("/profile/change-password", changeAdminPassword);

module.exports = router;

