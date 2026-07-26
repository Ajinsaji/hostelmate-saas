const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { createVendor, getVendors } = require("../controllers/vendorController");

router.use(ownerAuth);

router.post("/", createVendor);
router.get("/", getVendors);

module.exports = router;
