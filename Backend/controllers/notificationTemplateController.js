const templateService = require("../services/notificationTemplateService");
const NotificationTemplate = require("../models/NotificationTemplate");
const { logger } = require("../utils/logger");

const getTemplates = async (req, res) => {
  try {
    const templates = await templateService.getTemplates();
    return res.status(200).json({ success: true, templates });
  } catch (err) {
    logger.error("getTemplates error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const createTemplate = async (req, res) => {
  try {
    const template = await NotificationTemplate.create(req.body);
    return res.status(201).json({ success: true, message: "Template Created", template });
  } catch (err) {
    logger.error("createTemplate error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create template" });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const template = await NotificationTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ success: true, message: "Template Updated", template });
  } catch (err) {
    logger.error("updateTemplate error:", err);
    return res.status(400).json({ success: false, message: err.message || "Update failed" });
  }
};

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
};
