const Notification = require("../models/Notification");
const { logger } = require("../utils/logger");

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY INVARIANT
//   Every notification belongs to exactly ONE user identified by Notification.userId.
//   All retrieval, counting, and mutation MUST be scoped to authenticatedUserId.
//   hostelId is business context only — never the security boundary.
//   recipientId is kept as a migration-compatibility fallback during transition;
//   it will be removed once all legacy records are backfilled with userId.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the canonical recipient ownership query.
 *
 * Security rule: ONLY returns notifications where either
 *   userId  === authenticatedUserId   (new canonical path)
 *   OR
 *   recipientId === authenticatedUserId  (migration compat: pre-userId records)
 *
 * { recipientId: null } is NEVER included. A null recipient is an invalid /
 * incomplete record and must NOT be returned to any user.
 *
 * @param {string|ObjectId} authenticatedUserId — from verified JWT, never from req.body
 */
function buildRecipientQuery(authenticatedUserId) {
  if (!authenticatedUserId) {
    // Fail closed: return a query that matches nothing rather than everything
    return { _id: null };
  }
  return {
    $or: [
      { userId: authenticatedUserId },
      { recipientId: authenticatedUserId },
    ],
  };
}

/**
 * Shared Notification Dispatcher
 *
 * SECURITY: caller MUST supply a resolved recipientUserId from the authoritative
 * server-side owner record. Never pass a frontend-supplied userId here.
 *
 * Fails closed: throws if neither recipientUserId nor recipientId is provided,
 * because a user-targeted notification with no canonical owner must not be created.
 */
async function dispatchNotification(data) {
  try {
    // Resolve canonical recipient — server-supplied, never from req.body directly
    const canonicalUserId = data.recipientUserId || data.recipientId || data.userId || null;

    if (!canonicalUserId) {
      // Fail closed: do not create a notification without a known owner
      throw new Error(
        "dispatchNotification requires a canonical recipientUserId. " +
        "User-targeted notifications must have an identified owner."
      );
    }

    const hostelId = data.hostelId || null;

    const notification = await Notification.create({
      // Canonical ownership field — this is the authoritative query target
      userId: canonicalUserId,
      // Legacy compat — kept during migration window; same value as userId
      recipientId: canonicalUserId,
      tenantId: hostelId,
      hostelId,
      type: data.type || "System",
      title: data.title,
      message: data.message,
      priority: data.priority || "Medium",
      channel: data.channel || "In-App",
      recipientType: data.recipientType || "Owner",
      status: "Sent",
      sentAt: new Date(),
      readAt: null,
      referenceType: data.referenceType || "",
      referenceId: data.referenceId || null,
      createdBy: data.createdBy || null,
    });

    logger.info(
      `[NOTIFICATION CREATED] notificationId=${notification._id} ` +
      `recipientUserId=${canonicalUserId} recipientRole=${data.recipientType || "Owner"} ` +
      `recipientHostelId=${hostelId || "none"} type=${notification.type} ` +
      `source=dispatchNotification`
    );

    return notification;
  } catch (err) {
    logger.error("dispatchNotification error:", err.message || err);
    throw err;
  }
}

/**
 * Get Paginated Notifications for the authenticated user.
 *
 * @param {string|ObjectId} authenticatedUserId — from verified JWT
 */
async function getNotifications({
  authenticatedUserId,
  unreadOnly = false,
  page = 1,
  limit = 20,
}) {
  const ownershipQuery = buildRecipientQuery(authenticatedUserId);

  const query = { ...ownershipQuery };
  if (unreadOnly) {
    // readAt: null is the schema-accurate "unread" sentinel.
    // status: { $ne: "Read" } alone would match Failed/Pending permanently — avoid it.
    query.readAt = null;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Notification.countDocuments(query),
  ]);

  const returnedIds = notifications.map((n) => String(n._id));
  logger.info(
    `[NOTIFICATION FETCH] authenticatedUserId=${authenticatedUserId} ` +
    `returnedCount=${notifications.length} total=${total} ` +
    `notificationIds=[${returnedIds.slice(0, 5).join(", ")}${returnedIds.length > 5 ? "…" : ""}]`
  );

  return { notifications, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
}

/**
 * Get Unread Notification Count for the authenticated user.
 *
 * @param {string|ObjectId} authenticatedUserId — from verified JWT
 */
async function getUnreadCount({ authenticatedUserId }) {
  const ownershipQuery = buildRecipientQuery(authenticatedUserId);
  const query = { ...ownershipQuery, readAt: null };

  const count = await Notification.countDocuments(query);

  logger.info(
    `[UNREAD COUNT] authenticatedUserId=${authenticatedUserId} count=${count}`
  );

  return count;
}

/**
 * Mark a single notification as Read.
 *
 * SECURITY: enforces ownership — only marks if the notification belongs
 * to authenticatedUserId. Returns 404-equivalent error if not found or
 * if it belongs to a different user.
 *
 * @param {string} notificationId
 * @param {string|ObjectId} authenticatedUserId — from verified JWT
 */
async function markAsRead(notificationId, authenticatedUserId) {
  if (!authenticatedUserId) {
    throw new Error("Authentication required to mark notification as read");
  }

  const ownershipQuery = buildRecipientQuery(authenticatedUserId);
  const notification = await Notification.findOne({
    _id: notificationId,
    ...ownershipQuery,
  });

  if (!notification) {
    // Return a generic "not found" — do not reveal whether it exists for another user
    throw new Error("Notification not found");
  }

  notification.status = "Read";
  notification.readAt = new Date();
  await notification.save();
  return notification;
}

/**
 * Mark All unread notifications as Read for the authenticated user.
 *
 * @param {string|ObjectId} authenticatedUserId — from verified JWT
 */
async function markAllAsRead({ authenticatedUserId }) {
  const ownershipQuery = buildRecipientQuery(authenticatedUserId);
  const query = { ...ownershipQuery, readAt: null };

  const result = await Notification.updateMany(query, {
    $set: { status: "Read", readAt: new Date() },
  });

  logger.info(
    `[NOTIFICATION MARK_ALL_READ] authenticatedUserId=${authenticatedUserId} ` +
    `modifiedCount=${result.modifiedCount}`
  );

  return result;
}

module.exports = {
  dispatchNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  // Exported for use in socketManager and other internal callers
  buildRecipientQuery,
};
