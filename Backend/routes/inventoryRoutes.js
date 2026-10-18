const express = require("express");
const router = express.Router();
const kitchenAuth = require("../middleware/kitchenAuth");
const { createItem, getItems, scanLowStock, adjustStock } = require("../controllers/inventoryController");

router.use(kitchenAuth);

router.post("/", createItem);
router.get("/", getItems);
router.post("/scan-low-stock", scanLowStock);
router.patch("/:itemId/stock", adjustStock);

module.exports = router;
