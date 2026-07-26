const Menu = require("../models/Menu");
const { dispatchNotification } = require("./notificationCenterService");
const { logger } = require("../utils/logger");

async function createOrUpdateMenu(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const menuDate = data.menuDate ? new Date(data.menuDate) : new Date();
  menuDate.setHours(0, 0, 0, 0);

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
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  let menu = await Menu.findOne({ hostelId, menuDate: targetDate });
  if (!menu) {
    // Return empty default menu object
    menu = {
      menuDate: targetDate,
      breakfast: "Poha / Idli & Tea",
      lunch: "Roti, Rice, Dal, Sabzi & Curd",
      snacks: "Tea & Biscuits",
      dinner: "Roti, Rice, Paneer / Mixed Veg & Sweet",
      status: "Published",
    };
  }
  return menu;
}

module.exports = {
  createOrUpdateMenu,
  getMenuForDate,
};
