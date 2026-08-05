const StorageUsage = require("../models/StorageUsage");
const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");
const { logger } = require("../utils/logger");

class StorageQueueService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  /**
   * Queue a storage usage update task
   * @param {string} workspaceId 
   * @param {string} hostelId 
   * @param {string} category - e.g. 'residentImages', 'documents', 'receipts', 'exports', 'otherFiles'
   * @param {number} bytes - size of the uploaded file
   */
  queueUploadUpdate(workspaceId, hostelId, category, bytes) {
    if (!workspaceId) return;
    
    // Standardize category name
    const validCategories = ["residentImages", "documents", "receipts", "exports", "otherFiles"];
    const targetCategory = validCategories.includes(category) ? category : "otherFiles";

    this.queue.push({
      workspaceId,
      hostelId: hostelId || null,
      category: targetCategory,
      bytes: Number(bytes) || 0,
    });

    logger.info(`[StorageQueue] Queued upload update of ${bytes} bytes for workspace ${workspaceId}`);
    
    // Trigger loop execution asynchronously
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const task = this.queue.shift();

    try {
      await this.updateStorageUsage(task);
    } catch (err) {
      logger.error(`[StorageQueue] Failed to process storage update task: ${err.message}`);
    }

    // Process next task
    setTimeout(() => this.processQueue(), 50);
  }

  async updateStorageUsage({ workspaceId, hostelId, category, bytes }) {
    let storage = await StorageUsage.findOne({ workspaceId });
    if (!storage) {
      storage = new StorageUsage({
        workspaceId,
        usedBytes: 0,
        residentImages: 0,
        documents: 0,
        receipts: 0,
        exports: 0,
        otherFiles: 0,
        hostelBreakdown: [],
      });
    }

    // Update workspace totals
    storage.usedBytes += bytes;
    storage[category] = (storage[category] || 0) + bytes;

    // Update hostel breakdown if hostelId is specified
    if (hostelId) {
      let breakdownItem = storage.hostelBreakdown.find(
        (item) => String(item.hostelId) === String(hostelId)
      );

      if (!breakdownItem) {
        breakdownItem = {
          hostelId,
          usedBytes: 0,
          residentImages: 0,
          documents: 0,
          receipts: 0,
          exports: 0,
          otherFiles: 0,
        };
        storage.hostelBreakdown.push(breakdownItem);
        // Find newly added item in list to reference it
        breakdownItem = storage.hostelBreakdown[storage.hostelBreakdown.length - 1];
      }

      breakdownItem.usedBytes += bytes;
      breakdownItem[category] = (breakdownItem[category] || 0) + bytes;
    }

    await storage.save();
    logger.info(`[StorageQueue] Storage updated for workspace ${workspaceId}. New total: ${storage.usedBytes} bytes.`);

    // Perform threshold check
    await this.checkThresholds(workspaceId, storage.usedBytes);
  }

  async checkThresholds(workspaceId, usedBytes) {
    try {
      const subscription = await Subscription.findOne({ workspaceId });
      if (!subscription) return;

      const planName = subscription.plan || "base";
      const planLimits = await Plan.findOne({ name: planName });
      const limit = planLimits ? planLimits.storageLimit : (subscription.storageLimit || 5368709120);

      if (!limit || limit === 999999) return;

      const usagePercentage = (usedBytes / limit) * 100;
      let warnMessage = null;

      if (usagePercentage >= 100) {
        warnMessage = `CRITICAL: Storage limit reached (100% capacity) for workspace ${workspaceId}!`;
      } else if (usagePercentage >= 95) {
        warnMessage = `WARNING: Storage usage is at 95% capacity for workspace ${workspaceId}.`;
      } else if (usagePercentage >= 90) {
        warnMessage = `WARNING: Storage usage is at 90% capacity for workspace ${workspaceId}.`;
      } else if (usagePercentage >= 80) {
        warnMessage = `WARNING: Storage usage is at 80% capacity for workspace ${workspaceId}.`;
      }

      if (warnMessage) {
        logger.warn(`[StorageQueue] ${warnMessage}`);
        
        const EventBus = require("./EventBus");
        EventBus.emit("STORAGE_LIMIT_WARNING", {
          workspaceId,
          usedBytes,
          limit,
          percentage: usagePercentage,
          message: warnMessage,
        });
      }
    } catch (err) {
      logger.error(`[StorageQueue] Error in threshold checking: ${err.message}`);
    }
  }
}

module.exports = new StorageQueueService();
