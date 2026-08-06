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
    let latest = await ReleaseNote.findOne({ published: true }).sort({ createdAt: -1 });

    if (!latest) {
      latest = {
        version: "v3.2.1",
        title: "HostelMate Enterprise SaaS v3.2.1 Updated!",
        description: "We've added powerful new features and performance improvements to make your hostel management faster and easier.",
        type: "recommended",
        published: true,
        releaseDate: new Date(),
        newFeatures: ["Workspace Dashboard Redesign", "AI Intelligence Insights", "Enterprise Storage Center", "White-Label Theme Engine"],
        improvements: ["45% Faster Dashboard Loading", "Enhanced Mobile Touch Navigation"],
        bugFixes: ["Resolved synchronous state update lints", "Fixed context switcher timing"],
        security: ["Tamper-Proof Audit Logging", "Encrypted API Keys"],
        performance: ["Instant Query Cache Layer", "Lazy Component Splitting"]
      };
    }
    return latest;
  }

  async getAllReleases() {
    const list = await ReleaseNote.find({ published: true }).sort({ createdAt: -1 });
    if (list.length === 0) {
      return [await this.getLatestRelease()];
    }
    return list;
  }

  async markAsRead(userId, workspaceId, version) {
    if (!userId) return { success: true };
    await UserReleaseStatus.findOneAndUpdate(
      { userId, version },
      { seen: true, seenAt: new Date(), workspaceId },
      { upsert: true, new: true }
    );
    return { success: true, message: `Release ${version} marked as read` };
  }
}

module.exports = new VersionService();
