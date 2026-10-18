class BackupService {
  async getBackups(workspaceId) {
    return {
      success: false,
      preview: true,
      backups: [],
      message: "Backup inventory is unavailable because backup storage is not configured.",
    };
  }

  async createBackup(workspaceId, { type }) {
    return { success: false, preview: true, message: "Backup creation is unavailable because no backup provider is configured." };
  }

  async restoreBackup(workspaceId, { backupId }) {
    return { success: false, preview: true, message: "Backup restore is unavailable because no verified backup provider is configured." };
  }

  async deleteBackup(workspaceId, backupId) {
    return { success: false, preview: true, message: "Backup deletion is unavailable because backup storage is not configured." };
  }
}

module.exports = new BackupService();
