/**
 * HOSTELMATE ENTERPRISE — RENT REMINDER SCHEDULER ENGINE
 *
 * Scans active residents and schedules rent reminders with deterministic idempotency keys:
 * RENT_REMINDER_${residentId}_${yearMonth}_${scheduleType}
 */

"use strict";

const Resident = require("../models/Resident");
const Hostel = require("../models/Hostel");
const EventBus = require("./EventBus");
const { logger } = require("../utils/logger");

async function scanAndDispatchRentReminders() {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;
    const yearMonth = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}`;

    // Find all active residents with assigned hostel
    const residents = await Resident.find({
      isDeleted: false,
      status: { $in: ["Active", "active", "Notice Period"] },
    }).populate("roomId");

    let countDispatched = 0;

    for (const resident of residents) {
      if (!resident.phone || !resident.hostelId) continue;

      const monthlyRent = resident.monthlyRent || 0;
      if (monthlyRent <= 0) continue;

      // Determine due date (default to 5th of current month if not explicitly specified)
      const dueDay = resident.rentDueDay || 5;
      const dueDate = new Date(currentYear, currentMonthNum - 1, dueDay);

      const diffTime = now.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let scheduleType = null;
      let isOverdue = false;

      // Schedule rules:
      // -7: 7 days before
      // -3: 3 days before
      // -1: 1 day before
      // 0: Due today
      // 3: 3 days overdue
      // 7: 7 days overdue
      if (diffDays === -7) scheduleType = "BEFORE_7_DAYS";
      else if (diffDays === -3) scheduleType = "BEFORE_3_DAYS";
      else if (diffDays === -1) scheduleType = "BEFORE_1_DAY";
      else if (diffDays === 0) scheduleType = "DUE_TODAY";
      else if (diffDays === 3) { scheduleType = "OVERDUE_3_DAYS"; isOverdue = true; }
      else if (diffDays === 7) { scheduleType = "OVERDUE_7_DAYS"; isOverdue = true; }

      if (!scheduleType) continue;

      const referenceId = `RENT_REMINDER_${resident._id}_${yearMonth}_${scheduleType}`;
      const hostelName = resident.hostelId?.hostelName || "HostelMate";
      const roomNumber = resident.roomId?.roomNumber || resident.roomNumber || "—";

      const eventPayload = {
        hostelId: resident.hostelId._id || resident.hostelId,
        residentId: resident._id,
        phone: resident.phone,
        residentName: resident.fullName || `${resident.firstName || ""} ${resident.lastName || ""}`.trim(),
        amount: monthlyRent,
        month: yearMonth,
        dueDate,
        hostelName,
        roomNumber,
        referenceId,
      };

      if (isOverdue) {
        EventBus.emit("RENT_OVERDUE", eventPayload);
      } else {
        EventBus.emit("RENT_DUE", eventPayload);
      }

      countDispatched++;
    }

    logger.info(`[RentReminderEngine] Scanned residents and dispatched ${countDispatched} reminders for ${yearMonth}`);
    return { success: true, countDispatched, period: yearMonth };
  } catch (error) {
    logger.error({ err: error }, "[RentReminderEngine] Rent reminder scan failed");
    return { success: false, error: error.message };
  }
}

module.exports = {
  scanAndDispatchRentReminders,
};
