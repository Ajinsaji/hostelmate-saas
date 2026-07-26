const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { createRecipe, getRecipes } = require("../controllers/recipeController");

router.use(ownerAuth);

router.post("/", createRecipe);
router.get("/", getRecipes);

module.exports = router;
