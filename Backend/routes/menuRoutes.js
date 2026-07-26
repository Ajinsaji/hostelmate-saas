const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { createOrUpdateMenu, getMenu } = require("../controllers/menuController");

router.use(ownerAuth);

router.post("/", createOrUpdateMenu);
router.get("/", getMenu);

module.exports = router;
