const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { createItem, getItems, scanLowStock } = require("../controllers/inventoryController");

router.use(ownerAuth);

router.post("/", createItem);
router.get("/", getItems);
router.post("/scan-low-stock", scanLowStock);

module.exports = router;
