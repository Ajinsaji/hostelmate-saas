const { assertPeriodOpen } = require("../services/financialPeriodService");
const { logger } = require("../utils/logger");

/**
 * Middleware that verifies the target financial period is OPEN before allowing write/update/delete requests
 */
async function checkFinancialPeriodLock(req, res, next) {
  try {
    const hostelId = req.owner?.hostelId || req.user?.hostelId || req.body?.hostelId;
    if (!hostelId) return next();

    // Determine target transaction date from request body or query or default to now
    const targetDate = req.body?.expenseDate || req.body?.issueDate || req.body?.paymentDate || req.body?.receivedDate || new Date();

    await assertPeriodOpen(hostelId, targetDate);
    next();
  } catch (err) {
    logger.warn(`Financial Period Lock Blocked Request: ${err.message}`);
    return res.status(403).json({
      success: false,
      message: err.message || "Financial period is locked. Historical records cannot be modified.",
    });
  }
}

module.exports = checkFinancialPeriodLock;
