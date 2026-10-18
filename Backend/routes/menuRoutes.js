const express = require("express");
const router = express.Router();
const kitchenAuth = require("../middleware/kitchenAuth");
const { createOrUpdateMenu, getMenu } = require("../controllers/menuController");

router.use(kitchenAuth);

router.post("/", createOrUpdateMenu);
router.get("/", getMenu);

module.exports = router;
