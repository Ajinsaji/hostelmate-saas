const { getMessaging } = require("./firebaseAdmin");

async function sendPushToUserDevices({ userId, hostelId, title, body, data }) {
  const messaging = getMessaging();
  if (!messaging) {
    // Firebase not configured yet.
    return { success: false, reason: "firebase_not_configured" };
  }

  // Tokens are stored in Mongo. Caller should already fetch tokens.
  // This helper just sends a multicast.
  const tokens = data?.tokens || [];
  if (!Array.isArray(tokens) || tokens.length === 0) return { success: true, sent: 0 };

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

  const res = await messaging.sendMulticast(message);
  return res;
}

module.exports = { sendPushToUserDevices };

