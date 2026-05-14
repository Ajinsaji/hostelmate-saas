const Notification = require("../models/Notification");
const DeviceToken = require("../models/DeviceToken");
const { sendPushToUserDevices } = require("./fcmService");

async function publishNotification({ userId, hostelId, type, message, meta, role }) {
  // Persist first (scoped to target hostel when provided)
  const notification = await Notification.create({
    userId,
    hostelId: hostelId || null,
    type,
    message,
    meta: meta || {},
  });

  // Push (optional: if firebase configured)
  try {
    const tokens = await DeviceToken.find({
      userId,
      isActive: true,
      ...(hostelId ? { hostelId } : {}),
      ...(role ? { role } : {}),
    }).select("token");


    const tokenList = tokens.map((t) => t.token);

    // When FCM isn't configured, helper will no-op.
    await sendPushToUserDevices({
      userId,
      hostelId,
      title: "HostelMate",
      body: message,
      data: {
        tokens: tokenList,
        payload: {
          type,
          notificationId: String(notification._id),
          route: meta?.route || "",
        },
      },
    });
  } catch (e) {
    // Never block main workflow
    console.error("publishNotification push error:", e?.message || e);
  }

  return notification;
}

module.exports = { publishNotification };

