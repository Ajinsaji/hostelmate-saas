const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../controllers/adminController.js');
let code = fs.readFileSync(targetPath, 'utf8');

const backupLogic = `

const { runApplicationBackup } = require('../utils/BackupService');
const Backup = require('../models/Backup');

const runBackup = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const result = await runApplicationBackup(adminId);
    res.status(200).json({ success: true, backup: result });
  } catch (error) {
    const { logger } = require("../utils/logger");
    logger.error({ err: error }, "Backup failed");
    res.status(500).json({ success: false, message: "Backup failed" });
  }
};

const getBackups = async (req, res) => {
  try {
    const backups = await Backup.find().sort({ createdAt: -1 }).populate('createdBy', 'username email');
    res.status(200).json({ success: true, data: backups });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const downloadBackup = async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    if (!backup) return res.status(404).json({ success: false, message: "Backup not found" });
    
    res.download(backup.filePath, \`\${backup.backupId}.zip\`);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports.runBackup = runBackup;
module.exports.getBackups = getBackups;
module.exports.downloadBackup = downloadBackup;
`;

fs.appendFileSync(targetPath, backupLogic);
console.log("Appended backup logic to adminController.js");
