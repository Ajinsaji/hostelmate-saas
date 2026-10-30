/**
 * Timezone & IST (UTC+05:30) Date Boundary Utilities
 * 
 * Guarantees consistent Indian Standard Time calendar-day and month boundaries
 * regardless of the host server's local operating system timezone (e.g. Render UTC).
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 19,800,000 ms

/**
 * Returns IST calendar date components (year, month 0-11, date 1-31) for a given UTC timestamp.
 * Uses pure UTC getters on an offset timestamp, completely independent of host OS timezone.
 *
 * @param {Date|number|string} [refDate=new Date()] Reference date
 * @returns {{ year: number, month: number, date: number, istDate: Date }}
 */
function getISTDateComponents(refDate = new Date()) {
  const d = refDate instanceof Date ? refDate : new Date(refDate);
  const istTime = d.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istTime);
  return {
    year: istDate.getUTCFullYear(),
    month: istDate.getUTCMonth(),
    date: istDate.getUTCDate(),
    istDate,
  };
}

/**
 * Returns the exact UTC Date object representing 00:00:00.000 IST for the calendar day of refDate.
 * 
 * Example: For any time on 30 Oct 2026 IST, returns 2026-10-29T18:30:00.000Z.
 *
 * @param {Date|number|string} [refDate=new Date()]
 * @returns {Date} UTC Date corresponding to IST 00:00:00.000
 */
function getISTStartOfDay(refDate = new Date()) {
  const { year, month, date } = getISTDateComponents(refDate);
  return new Date(Date.UTC(year, month, date, 0, 0, 0, 0) - IST_OFFSET_MS);
}

/**
 * Returns the exact UTC Date object representing 23:59:59.999 IST for the calendar day of refDate.
 *
 * Example: For any time on 30 Oct 2026 IST, returns 2026-10-30T18:29:59.999Z.
 *
 * @param {Date|number|string} [refDate=new Date()]
 * @returns {Date} UTC Date corresponding to IST 23:59:59.999
 */
function getISTEndOfDay(refDate = new Date()) {
  const { year, month, date } = getISTDateComponents(refDate);
  return new Date(Date.UTC(year, month, date, 23, 59, 59, 999) - IST_OFFSET_MS);
}

/**
 * Returns the exact UTC Date object representing 00:00:00.000 IST for the 1st day of the month of refDate.
 *
 * Example: For any time in Oct 2026 IST, returns 2026-09-30T18:30:00.000Z.
 *
 * @param {Date|number|string} [refDate=new Date()]
 * @returns {Date} UTC Date corresponding to IST 00:00:00.000 on the 1st of the month
 */
function getISTStartOfMonth(refDate = new Date()) {
  const { year, month } = getISTDateComponents(refDate);
  return new Date(Date.UTC(year, month, 1, 0, 0, 0, 0) - IST_OFFSET_MS);
}

/**
 * Returns the exact UTC Date object representing 23:59:59.999 IST for the last day of the month of refDate.
 *
 * @param {Date|number|string} [refDate=new Date()]
 * @returns {Date} UTC Date corresponding to IST 23:59:59.999 on the last day of the month
 */
function getISTEndOfMonth(refDate = new Date()) {
  const { year, month } = getISTDateComponents(refDate);
  const maxDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, maxDays, 23, 59, 59, 999) - IST_OFFSET_MS);
}

/**
 * Formats a date into Indian Standard Time date string (DD/MM/YYYY)
 *
 * @param {Date|number|string} date
 * @returns {string}
 */
function formatISTDate(date) {
  if (!date) return "N/A";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
}

module.exports = {
  IST_OFFSET_MS,
  getISTDateComponents,
  getISTStartOfDay,
  getISTEndOfDay,
  getISTStartOfMonth,
  getISTEndOfMonth,
  formatISTDate,
};
