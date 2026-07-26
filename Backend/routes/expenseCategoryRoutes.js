const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { createCategory, getCategories } = require("../controllers/expenseCategoryController");

router.use(ownerAuth);

router.post("/", createCategory);
router.get("/", getCategories);

module.exports = router;
