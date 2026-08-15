const Resident = require("../models/Resident");

/**
 * Calculates dynamic resident-based subscription billing with accurate proration.
 * Pricing convention: ₹10 per active resident per 30-day billing cycle.
 *
 * @param {object} params
 * @param {string|ObjectId} params.hostelId
 * @param {Date|string} [params.periodStart]
 * @param {Date|string} [params.periodEnd]
 * @param {number} [params.monthlyRate=10]
 * @returns {Promise<{
 *   residentCount: number,
 *   monthlyRate: number,
 *   billingPeriodDays: number,
 *   fullPeriodCharge: number,
 *   proratedCharge: number,
 *   totalAmount: number,
 *   lineItems: Array<{
 *     residentId: string,
 *     name: string,
 *     roomNo: string,
 *     admissionDate: Date,
 *     checkOutDate: Date|null,
 *     status: string,
 *     activeDays: number,
 *     billingDays: number,
 *     charge: number
 *   }>
 * }>}
 */
async function calculateResidentBilling({
  hostelId,
  periodStart = null,
  periodEnd = null,
  monthlyRate = 10,
}) {
  const rate = Number(monthlyRate) || 10;
  const now = new Date();

  // Normalize period dates
  const pStart = periodStart ? new Date(periodStart) : new Date(now.getFullYear(), now.getMonth(), 1);
  const pEnd = periodEnd
    ? new Date(periodEnd)
    : new Date(pStart.getTime() + 30 * 24 * 60 * 60 * 1000 - 1000);

  // Compute billing period days (standard 30-day convention)
  const diffDays = Math.round((pEnd.getTime() - pStart.getTime()) / (24 * 60 * 60 * 1000));
  const billingPeriodDays = diffDays > 0 ? diffDays : 30;

  // Query only valid, non-deleted, active residents (and those active during this period)
  const residents = await Resident.find({
    hostelId,
    isDeleted: false,
    status: { $in: ["Active", "active", "Notice Period", "Checked Out", "checked_out"] },
  }).populate("roomId");

  const lineItems = [];
  let totalCalculatedAmount = 0;
  let activeResidentCount = 0;

  for (const res of residents) {
    const rawJoin = res.joiningDate || res.joinDate || res.checkInDate || res.createdAt;
    const joinDate = rawJoin ? new Date(rawJoin) : pStart;

    const rawExit = res.actualCheckoutDate || (res.status === "Checked Out" || res.status === "checked_out" ? res.updatedAt : null);
    const exitDate = rawExit ? new Date(rawExit) : null;

    // Check if resident was active within the period window
    if (joinDate > pEnd) {
      // Joined after this period ended
      continue;
    }

    if (exitDate && exitDate < pStart) {
      // Checked out before this period started
      continue;
    }

    // Determine active date interval within [pStart, pEnd]
    const effectiveStart = joinDate > pStart ? joinDate : pStart;
    const effectiveEnd = exitDate && exitDate < pEnd ? exitDate : pEnd;

    // Calculate active billable calendar days (inclusive)
    let activeDays = 0;
    if (joinDate <= pStart && (!exitDate || exitDate >= pEnd)) {
      // Active whole period
      activeDays = billingPeriodDays;
    } else {
      // Calculate inclusive days
      const sDate = new Date(effectiveStart.getFullYear(), effectiveStart.getMonth(), effectiveStart.getDate());
      const eDate = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), effectiveEnd.getDate());
      const rawActive = Math.round((eDate.getTime() - sDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      activeDays = Math.max(1, Math.min(billingPeriodDays, rawActive));
    }

    // Prorated charge formula: (monthlyRate / billingPeriodDays) * activeDays
    const exactCharge = (rate / billingPeriodDays) * activeDays;
    const charge = Math.round(exactCharge * 100) / 100;

    const isCurrentlyActive = res.status === "Active" || res.status === "active";
    if (isCurrentlyActive) {
      activeResidentCount++;
    }

    totalCalculatedAmount += charge;

    lineItems.push({
      residentId: String(res._id),
      name: res.fullName || res.name || `${res.firstName || ""} ${res.lastName || ""}`.trim() || "Resident",
      roomNo: res.roomId?.roomNumber || res.roomNumber || "N/A",
      admissionDate: joinDate,
      checkOutDate: exitDate,
      status: res.status,
      activeDays,
      billingDays: billingPeriodDays,
      charge,
    });
  }

  // Precision formatting
  const totalAmount = Math.round(totalCalculatedAmount * 100) / 100;
  const fullPeriodCharge = activeResidentCount * rate;
  const proratedCharge = Math.max(0, totalAmount);

  return {
    residentCount: activeResidentCount || lineItems.length,
    monthlyRate: rate,
    billingPeriodDays,
    fullPeriodCharge,
    proratedCharge,
    totalAmount,
    lineItems,
  };
}

module.exports = {
  calculateResidentBilling,
};
