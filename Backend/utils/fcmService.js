const { getMessaging } = require("./firebaseAdmin");
const DeviceToken = require("../models/DeviceToken");

async function sendPushToUserDevices({ userId, hostelId, title, body, data }) {
  const messaging = getMessaging();
  if (!messaging) {
    console.warn("Firebase Admin SDK not initialized. FCM sending disabled.");
    return { success: false, reason: "firebase_not_configured" };
  }

  // Tokens are stored in Mongo. Caller should already fetch tokens.
  // This helper just sends a multicast.
  const tokens = data?.tokens || [];
  
  if (!Array.isArray(tokens) || tokens.length === 0) {
    console.log(`[fcmService] No device tokens found for userId ${userId}`);
    return { success: true, sent: 0 };
  }

  console.log(`[fcmService] Sending FCM to ${tokens.length} device(s) for user ${userId}`);

  const message = {
    tokens,
    notification: {
      title: title || "HostelMate",
      body: body || "New notification",
    },
    data: Object.entries(data?.payload || {}).reduce((acc, [k, v]) => {
      acc[k] = typeof v === "string" ? v : JSON.stringify(v);
      return acc;
    }, {}),
    android: {
      priority: "high",
    },
  };

  try {
    const res = await messaging.sendEachForMulticast(message);

    console.log(`[fcmService] FCM send result:`, {
      successCount: res.successCount,
      failureCount: res.failureCount,
      total: tokens.length,
    });

    if (res.failureCount > 0) {
      console.warn(`[fcmService] ${res.failureCount} failures:`, res.responses);
    }

    const invalidTokens = [];
    res.responses.forEach((response, index) => {
      if (!response.success) {
        const errorCode = response.error?.code || response.error?.message || "unknown_error";
        if (
          errorCode === "registration-token-not-registered" ||
          errorCode === "messaging/registration-token-not-registered" ||
          errorCode?.endsWith("/registration-token-not-registered")
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      console.log(`[fcmService] Removing ${invalidTokens.length} invalid device token(s)`);
      await DeviceToken.deleteMany({ token: { $in: invalidTokens } });
    }

    return {
      success: res.failureCount === 0,
      successCount: res.successCount,
      failureCount: res.failureCount,
      total: tokens.length,
      invalidTokens,
      responses: res.responses,
    };
  } catch (error) {
    console.error("[fcmService] Failed to send FCM message:", error?.message || error);
    return { success: false, error: error?.message, sent: 0 };
  }
}

module.exports = { sendPushToUserDevices };

