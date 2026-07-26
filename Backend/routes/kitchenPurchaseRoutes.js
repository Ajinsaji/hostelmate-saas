const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { recordPurchase, getPurchases } = require("../controllers/kitchenPurchaseController");

router.use(ownerAuth);

router.post("/", recordPurchase);
router.get("/", getPurchases);

module.exports = router;
