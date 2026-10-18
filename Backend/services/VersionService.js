const ReleaseNote = require("../models/ReleaseNote");
const UserReleaseStatus = require("../models/UserReleaseStatus");

class VersionService {
  compareVersions(v1, v2) {
    if (!v1 || !v2) return 0;
    const cleanV1 = v1.replace(/^v/, "").split(".").map(Number);
    const cleanV2 = v2.replace(/^v/, "").split(".").map(Number);

    for (let i = 0; i < Math.max(cleanV1.length, cleanV2.length); i++) {
      const val1 = cleanV1[i] || 0;
      const val2 = cleanV2[i] || 0;
      if (val1 > val2) return 1;
      if (val1 < val2) return -1;
    }
    return 0;
  }

  async getLatestRelease() {
    return ReleaseNote.findOne({ published: true }).sort({ createdAt: -1 });
  }

  async getAllReleases() {
    const list = await ReleaseNote.find({ published: true }).sort({ createdAt: -1 });
    return list;
  }

  async markAsRead(userId, workspaceId, version) {
    if (!userId) return { success: true };
    await UserReleaseStatus.findOneAndUpdate(
      { userId, version },
      { seen: true, seenAt: new Date(), workspaceId },
      { upsert: true, returnDocument: "after" }
    );
    return { success: true, message: `Release ${version} marked as read` };
  }
}

module.exports = new VersionService();
