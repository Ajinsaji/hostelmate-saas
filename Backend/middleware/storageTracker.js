const StorageQueueService = require("../services/StorageQueueService");

/**
 * Middleware to track uploaded file sizes and queue updates to StorageUsage
 * @param {string} category - e.g. 'residentImages', 'documents', 'receipts', 'exports', 'otherFiles'
 */
const trackStorageUpload = (category) => {
  return (req, res, next) => {
    // If context isn't set up yet, we skip tracking (or wait)
    const context = req.context || {};
    const workspaceId = context.workspaceId;
    const hostelId = context.hostelId;

    if (!workspaceId) {
      return next();
    }

    // Track single file upload
    if (req.file) {
      StorageQueueService.queueUploadUpdate(workspaceId, hostelId, category, req.file.size);
    }

    // Track multiple files/fields upload
    if (req.files) {
      Object.keys(req.files).forEach((fieldName) => {
        const fileList = req.files[fieldName];
        if (Array.isArray(fileList)) {
          fileList.forEach((file) => {
            StorageQueueService.queueUploadUpdate(workspaceId, hostelId, category, file.size);
          });
        }
      });
    }

    next();
  };
};

module.exports = trackStorageUpload;
