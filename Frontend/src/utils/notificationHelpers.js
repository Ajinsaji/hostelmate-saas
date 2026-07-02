export const CATEGORY_LABELS = {
  all: "All",
  unread: "Unread",
  payments: "Payments",
  admissions: "Admissions",
  residents: "Residents",
  rooms: "Rooms",
  staff: "Staff",
  subscription: "Subscription",
  system: "System",
};

export function typeToUI(type) {
  switch (type) {
    case "admission_submitted":
      return { color: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)", label: "Admission", priorityColor: "#ef4444" };
    case "resident_approved":
      return { color: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", label: "Approved", priorityColor: "#10b981" };
    case "resident_rejected":
      return { color: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)", label: "Rejected", priorityColor: "#ef4444" };
    case "payment_uploaded":
      return { color: "rgba(20,241,217,0.12)", border: "rgba(20,241,217,0.25)", label: "Payment", priorityColor: "#14f1d9" };
    case "subscription_alert":
      return { color: "rgba(180,83,9,0.12)", border: "rgba(180,83,9,0.25)", label: "Subscription", priorityColor: "#b45309" };
    case "complaint_submitted":
      return { color: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.25)", label: "Complaint", priorityColor: "#8b5cf6" };
    case "resident_checkout":
      return { color: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.25)", label: "Checkout", priorityColor: "#f97316" };
    case "room_added":
      return { color: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)", label: "Room", priorityColor: "#3b82f6" };
    case "room_deleted":
      return { color: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)", label: "Room", priorityColor: "#ef4444" };
    case "staff_added":
      return { color: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.25)", label: "Staff", priorityColor: "#22c55e" };
    case "system_update":
      return { color: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.25)", label: "System", priorityColor: "#94a3b8" };
    default:
      return { color: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", label: "Update", priorityColor: "#64748b" };
  }
}

export function readableDateSection(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfWeek) return "Last Week";
  return "Earlier";
}

export function normalizeNotificationSearchText(notification) {
  const fields = [notification.title, notification.message, notification.type];
  const meta = notification.meta || {};
  fields.push(meta.residentId?.toString?.() || "");
  fields.push(meta.paymentId?.toString?.() || "");
  fields.push(meta.admissionId?.toString?.() || "");
  fields.push(meta.relatedId?.toString?.() || "");
  fields.push(notification.actionUrl || "");
  return fields.filter(Boolean).join(" ").toLowerCase();
}

export function filterNotifications(notifications, query, category) {
  const normalizedQuery = (query || "").trim().toLowerCase();
  return notifications.filter((notification) => {
    if (category && category !== "all") {
      if (category === "unread" && notification.isRead) return false;
      if (category !== "unread" && notification.category !== category) return false;
    }
    if (!normalizedQuery) return true;
    return normalizeNotificationSearchText(notification).includes(normalizedQuery);
  });
}

export function groupBySection(notifications) {
  return notifications.reduce((acc, notification) => {
    const section = readableDateSection(notification.createdAt);
    if (!acc[section]) acc[section] = [];
    acc[section].push(notification);
    return acc;
  }, {});
}
