const OwnerSession = require("../models/OwnerSession");
const { logger } = require("../utils/logger");

// Utility to parse basic User-Agent info
const parseUserAgent = (uaString = "") => {
  let browser = "Web Browser";
  let os = "Unknown OS";
  let deviceType = "desktop";

  const ua = uaString.toLowerCase();

  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    deviceType = ua.includes("ipad") ? "tablet" : "mobile";
    os = "iOS";
  } else if (ua.includes("android")) {
    deviceType = ua.includes("mobile") ? "mobile" : "tablet";
    os = "Android";
  } else if (ua.includes("windows")) {
    os = "Windows";
    deviceType = "desktop";
  } else if (ua.includes("macintosh") || ua.includes("mac os")) {
    os = "macOS";
    deviceType = "desktop";
  } else if (ua.includes("linux")) {
    os = "Linux";
    deviceType = "desktop";
  }

  if (ua.includes("edg/")) {
    browser = "Edge";
  } else if (ua.includes("chrome") || ua.includes("crios")) {
    browser = "Chrome";
  } else if (ua.includes("firefox") || ua.includes("fxios")) {
    browser = "Firefox";
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Safari";
  }

  return { browser, operatingSystem: os, deviceType };
};

// ==========================================
// GET ACTIVE SESSIONS FOR AUTHENTICATED OWNER
// ==========================================
const getActiveSessions = async (req, res) => {
  try {
    const ownerId = req.owner?.ownerId || req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized owner context" });
    }

    const currentSessionId = req.sessionId || req.headers["x-session-id"] || "";

    const sessions = await OwnerSession.find({
      ownerId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActiveAt: -1 });

    const formattedSessions = sessions.map((s) => {
      const isCurrent = s.sessionId === currentSessionId;
      return {
        sessionId: s.sessionId,
        deviceId: s.deviceId,
        deviceName: s.deviceName || `${s.operatingSystem} ${s.deviceType}`,
        deviceType: s.deviceType,
        browser: s.browser,
        operatingSystem: s.operatingSystem,
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
        currentSession: isCurrent,
      };
    });

    return res.status(200).json({
      success: true,
      sessions: formattedSessions,
      count: formattedSessions.length,
    });
  } catch (error) {
    logger.error("Error fetching owner sessions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active sessions",
      details: error?.message,
    });
  }
};

// ==========================================
// REVOKE A SPECIFIC SESSION BY SESSION ID
// ==========================================
const revokeSession = async (req, res) => {
  try {
    const ownerId = req.owner?.ownerId || req.user?.id;
    const { sessionId } = req.params;
    const currentSessionId = req.sessionId || req.headers["x-session-id"] || "";

    if (!ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized owner context" });
    }

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID required" });
    }

    // Security check: Owner identity verified against session ownerId
    const session = await OwnerSession.findOne({ sessionId, ownerId });
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (session.sessionId === currentSessionId) {
      return res.status(400).json({
        success: false,
        message: "Cannot revoke current session using this action. Please use sign out instead.",
      });
    }

    session.isRevoked = true;
    session.revokedAt = new Date();
    await session.save();

    logger.info(`Owner ${ownerId} revoked session ${sessionId}`);

    return res.status(200).json({
      success: true,
      message: "Device session signed out successfully",
    });
  } catch (error) {
    logger.error("Error revoking session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to revoke session",
      details: error?.message,
    });
  }
};

// ==========================================
// REVOKE ALL OTHER SESSIONS
// ==========================================
const revokeAllOtherSessions = async (req, res) => {
  try {
    const ownerId = req.owner?.ownerId || req.user?.id;
    const currentSessionId = req.sessionId || req.headers["x-session-id"] || "";

    if (!ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized owner context" });
    }

    const query = {
      ownerId,
      isRevoked: false,
    };

    if (currentSessionId) {
      query.sessionId = { $ne: currentSessionId };
    }

    const result = await OwnerSession.updateMany(query, {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    logger.info(`Owner ${ownerId} revoked ${result.modifiedCount} other sessions`);

    return res.status(200).json({
      success: true,
      message: `Signed out ${result.modifiedCount || 0} other device(s) successfully`,
      revokedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    logger.error("Error revoking other sessions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to revoke other sessions",
      details: error?.message,
    });
  }
};

module.exports = {
  parseUserAgent,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
};
