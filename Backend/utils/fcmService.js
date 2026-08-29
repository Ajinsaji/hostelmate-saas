const { logger } = require("./logger");
const { getMessaging } = require("./firebaseAdmin");
const DeviceToken = require("../models/DeviceToken");
const { createPerformanceTimer } = require("./performanceTiming");

async function sendPushToUserDevices({
  userId,
  hostelId,
  title,
  body,
  data = {},
}) {
  const timer = createPerformanceTimer("sendPushToUserDevices", logger);
  const messaging = getMessaging();

  if (!messaging) {
    console.warn("[fcmService] Firebase Admin SDK not initialized.");
    timer.finish("FCM performance");
    return {
      success: false,
      reason: "firebase_not_initialized",
    };
  }

  const tokens = Array.isArray(data.tokens) ? data.tokens : [];

  if (!tokens.length) {
    logger.info(
      `[fcmService] No registered device tokens found for user ${userId}`
    );
    timer.finish("FCM performance");
    return {
      success: true,
      sent: 0,
    };
  }

  logger.info(
    `[fcmService] Sending FCM to ${tokens.length} device(s) for user ${userId}`
  );

  const payloadData = {};

  Object.entries(data.payload || {}).forEach(([key, value]) => {
    payloadData[key] =
      typeof value === "string" ? value : JSON.stringify(value);
  });

  const message = {
    tokens,

    notification: {
      title: title || "HostelMate",
      body: body || "New notification",
    },

    data: payloadData,

    android: {
      priority: "high",
      notification: {
        channelId: "hostelmate_v2",
        sound: "default",
        defaultSound: true,
        defaultVibrateTimings: true,
        defaultLightSettings: true,
        visibility: "public",
        notificationPriority: "PRIORITY_HIGH",
        clickAction: "OPEN_ACTIVITY_1",
      },
    },

    webpush: {
      headers: {
        Urgency: "high",
      },
      notification: {
        title: title || "HostelMate",
        body: body || "New notification",
        icon: "/logo192.png",
        badge: "/logo192.png",
        requireInteraction: true,
      },
      fcmOptions: {
        link: payloadData.route
          ? (payloadData.route.startsWith("http") ? payloadData.route : `https://hostelmate-saas.vercel.app${payloadData.route.startsWith("/") ? "" : "/"}${payloadData.route}`)
          : "https://hostelmate-saas.vercel.app/",
      },
    },
  };

  try {
    const response = await messaging.sendEachForMulticast(message);

    logger.info("[fcmService] FCM send result:", {
      successCount: response.successCount,
      failureCount: response.failureCount,
      total: tokens.length,
    });

    if (response.failureCount > 0) {
      console.warn(
        `[fcmService] ${response.failureCount} message(s) failed`
      );
    }

    const invalidTokens = [];

    response.responses.forEach((res, index) => {
      const safeFingerprint = tokens[index] ? `${tokens[index].slice(0, 8)}...` : "unknown";
      if (!res.success) {
        logger.error(
          `[fcmService] Token failed (${safeFingerprint}):`,
          res.error?.code,
          res.error?.message
        );

        const code = res.error?.code || "";

        if (
          code === "messaging/registration-token-not-registered" ||
          code === "registration-token-not-registered" ||
          code.endsWith("/registration-token-not-registered")
        ) {
          invalidTokens.push(tokens[index]);
        }
      } else {
        logger.info(
          `[fcmService] Message sent successfully: ${res.messageId}`
        );
      }
    });

    if (invalidTokens.length) {
      logger.info(
        `[fcmService] Removing ${invalidTokens.length} invalid token(s)`
      );

      await timer.measure("invalidTokenCleanupMs", () => DeviceToken.deleteMany({
        token: { $in: invalidTokens },
      }));
    }

    timer.finish("FCM performance");
    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      total: tokens.length,
      invalidTokensCount: invalidTokens.length,
      responses: response.responses.map((r) => ({
        success: r.success,
        messageId: r.messageId || null,
        errorCode: r.error?.code || null,
      })),
    };
  } catch (error) {
    logger.error(
      "[fcmService] Fatal FCM error:",
      error?.message || error
    );

    timer.finish("FCM performance");
    return {
      success: false,
      error: error?.message || String(error),
    };
  }
}

module.exports = {
  sendPushToUserDevices,
};
