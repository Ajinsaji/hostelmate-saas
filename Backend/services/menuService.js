const Menu = require("../models/Menu");
const { dispatchNotification } = require("./notificationCenterService");
const { logger } = require("../utils/logger");

async function createOrUpdateMenu(data, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const menuDate = data.menuDate ? new Date(data.menuDate) : new Date();
  menuDate.setUTCHours(0, 0, 0, 0);

  let menu = await Menu.findOne({ hostelId, menuDate });
  if (menu) {
    Object.assign(menu, data);
    menu.status = data.status || "Published";
    await menu.save();
  } else {
    menu = await Menu.create({
      ...data,
      tenantId: hostelId,
      hostelId,
      menuDate,
      createdBy: userContext.userId,
    });
  }

  // Dispatch In-App Notification if published
  if (menu.status === "Published") {
    const dStr = menuDate.toLocaleDateString();
    try {
      await dispatchNotification({
        hostelId,
        type: "Announcement",
        title: `Daily Menu Published (${dStr})`,
        message: `Today's Menu: B: ${menu.breakfast || "N/A"} | L: ${menu.lunch || "N/A"} | D: ${menu.dinner || "N/A"}`,
        priority: "Low",
        recipientType: "Resident",
        referenceType: "Menu",
        referenceId: menu._id,
      });
    } catch (nErr) {
      logger.error("Failed to dispatch menu notification:", nErr);
    }
  }

  return menu;
}

async function getMenuForDate(hostelId, dateStr) {
  if (!hostelId) throw new Error("Hostel ID is required");
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  if (Number.isNaN(targetDate.getTime())) throw new Error("Invalid menu date");
  targetDate.setUTCHours(0, 0, 0, 0);

  return Menu.findOne({ hostelId, menuDate: targetDate });
}

module.exports = {
  createOrUpdateMenu,
  getMenuForDate,
};
