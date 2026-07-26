const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { getTemplates, createTemplate, updateTemplate } = require("../controllers/notificationTemplateController");

router.use(ownerAuth);

router.get("/", getTemplates);
router.post("/", createTemplate);
router.put("/:id", updateTemplate);

module.exports = router;
