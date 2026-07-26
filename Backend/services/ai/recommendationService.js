const AIRecommendation = require("../../models/AIRecommendation");
const AuditLog = require("../../models/AuditLog");

/**
 * Generate a new recommendation in the system, persisting it in "Pending" state.
 */
async function generateRecommendation(tenantId, category, recommendedAction, priority, confidence, explanation, evidence = {}) {
  const recommendation = await AIRecommendation.create({
    tenantId,
    category,
    recommendedAction,
    priority,
    confidence,
    explanation,
    evidence,
    status: "Pending",
  });

  await AuditLog.create({
    hostelId: tenantId,
    action: `AI Recommendation Generated: ${recommendedAction}`,
    actionType: "AI_RECOMMENDATION",
    entity: "AIRecommendation",
    targetId: recommendation._id,
  });

  return recommendation;
}

/**
 * Fetch pending recommendations for the dashboard.
 */
async function getPendingRecommendations(tenantId) {
  return await AIRecommendation.find({ tenantId, status: "Pending" }).sort({ confidence: -1, createdAt: -1 }).lean();
}

/**
 * Process human approval (Accept/Dismiss) on a recommendation.
 */
async function processRecommendationAction(tenantId, recommendationId, action, userId) {
  if (!["Accepted", "Dismissed"].includes(action)) {
    throw new Error("Invalid action. Must be 'Accepted' or 'Dismissed'");
  }

  const rec = await AIRecommendation.findOne({ _id: recommendationId, tenantId });
  if (!rec) throw new Error("Recommendation not found");

  rec.status = action;
  rec.approvedBy = userId;
  rec.executedAt = action === "Accepted" ? new Date() : null;
  await rec.save();

  await AuditLog.create({
    hostelId: tenantId,
    userId,
    action: `User ${action.toLowerCase()} AI Recommendation: ${rec.recommendedAction}`,
    actionType: `AI_RECOMMENDATION_${action.toUpperCase()}`,
    entity: "AIRecommendation",
    targetId: rec._id,
  });

  return rec;
}

module.exports = {
  generateRecommendation,
  getPendingRecommendations,
  processRecommendationAction,
};
