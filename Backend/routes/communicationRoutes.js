"use strict";

const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const {
  getCommunicationSettings,
  updateCommunicationSettings,
  sendWhatsApp,
  logManualWhatsAppClick,
  getCommunications,
  getCommunicationTemplates,
  getPendingCommunicationTasks,
  testWhatsAppDiagnostic,
  retryCommunication,
  getCommunicationDetail,
  triggerManualRentReminderScan,
} = require("../controllers/communicationController");

// Communication Settings & Diagnostics
router.get("/settings", ownerAuth, getCommunicationSettings);
router.put("/settings", ownerAuth, updateCommunicationSettings);
router.get("/diagnostics/status", ownerAuth, testWhatsAppDiagnostic);
router.post("/diagnostics/test", ownerAuth, testWhatsAppDiagnostic);

// Central WhatsApp Messaging Endpoints
router.post("/whatsapp/send", ownerAuth, sendWhatsApp);
router.post("/whatsapp/log-manual", ownerAuth, logManualWhatsAppClick);
router.post("/whatsapp/log-manual/:id", ownerAuth, logManualWhatsAppClick);
router.post("/whatsapp/retry/:id", ownerAuth, retryCommunication);
router.get("/whatsapp/detail/:id", ownerAuth, getCommunicationDetail);
router.post("/whatsapp/scan-reminders", ownerAuth, triggerManualRentReminderScan);

// Communication History & Templates
router.get("/history", ownerAuth, getCommunications);
router.get("/templates", ownerAuth, getCommunicationTemplates);
router.get("/tasks/pending", ownerAuth, getPendingCommunicationTasks);

// Legacy fallback listing
router.get("/", ownerAuth, getCommunications);

module.exports = router;
