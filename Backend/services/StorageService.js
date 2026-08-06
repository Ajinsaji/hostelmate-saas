class StorageService {
  async getStorageOverview(workspaceId) {
    return {
      success: true,
      storageUsedMB: 42,
      storageRemainingMB: 4958,
      storageLimitMB: 5000,
      usagePercentage: 0.84,
      categories: [
        { name: "Photos", count: 24, sizeMB: 18.5 },
        { name: "Receipts", count: 48, sizeMB: 12.2 },
        { name: "Documents", count: 15, sizeMB: 8.1 },
        { name: "Exports & Backups", count: 6, sizeMB: 3.2 }
      ],
      files: [
        { id: "file_1", name: "Aadhaar_Resident_101.pdf", category: "Documents", sizeMB: 1.2, uploadedAt: "2026-08-02" },
        { id: "file_2", name: "LPG_Receipt_Aug2026.png", category: "Receipts", sizeMB: 0.8, uploadedAt: "2026-08-04" },
        { id: "file_3", name: "Room204_Photos.jpg", category: "Photos", sizeMB: 4.5, uploadedAt: "2026-08-05" }
      ]
    };
  }

  async archiveItem(workspaceId, itemId) {
    return { success: true, message: `Item ${itemId} archived successfully` };
  }

  async cleanupStorage(workspaceId) {
    return { success: true, message: "Storage cleanup complete. 4.5 MB freed from temporary cache.", freedMB: 4.5 };
  }

  async deleteItem(workspaceId, itemId) {
    return { success: true, message: `Item ${itemId} permanently deleted` };
  }
}

module.exports = new StorageService();
