const aiService = require("../services/ai/aiService");
const { processRecommendationAction, getPendingRecommendations } = require("../services/ai/recommendationService");

exports.getDashboard = async (req, res, next) => {
  try {
    const tenantId = req.user.hostelId || req.user.tenantId || req.user.id;
    const insights = await aiService.getDashboardInsights(tenantId);
    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
};

exports.getPredictions = async (req, res, next) => {
  try {
    const tenantId = req.user.hostelId || req.user.tenantId || req.user.id;
    const occupancy = await aiService.predictOccupancy(tenantId);
    const revenue = await aiService.predictRevenue(tenantId);
    res.json({ success: true, data: { occupancy, revenue } });
  } catch (error) {
    next(error);
  }
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const tenantId = req.user.hostelId || req.user.tenantId || req.user.id;
    const recommendations = await getPendingRecommendations(tenantId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    next(error);
  }
};

exports.processRecommendationAction = async (req, res, next) => {
  try {
    const tenantId = req.user.hostelId || req.user.tenantId || req.user.id;
    const { id } = req.params;
    const { action } = req.body; // 'Accepted' or 'Dismissed'

    const result = await processRecommendationAction(tenantId, id, action, req.user.id);
    res.json({ success: true, data: result, message: `Recommendation ${action.toLowerCase()} successfully` });
  } catch (error) {
    next(error);
  }
};

exports.getAnomalies = async (req, res, next) => {
  try {
    const tenantId = req.user.hostelId || req.user.tenantId || req.user.id;
    const expenses = await aiService.analyzeExpenses(tenantId);
    const payroll = await aiService.analyzePayroll(tenantId);
    res.json({ success: true, data: { expenses: expenses.anomalies, payroll: payroll.anomalies } });
  } catch (error) {
    next(error);
  }
};

// Domain specific endpoints if needed by frontend directly:
exports.getForecast = async (req, res, next) => {
  // Can expand to specific domain forecasts if needed, but getPredictions handles it.
  this.getPredictions(req, res, next);
};

exports.getChurn = async (req, res, next) => {
  try {
    const tenantId = req.user.hostelId || req.user.tenantId || req.user.id;
    const churn = await aiService.predictResidentChurn(tenantId);
    res.json({ success: true, data: churn });
  } catch (error) {
    next(error);
  }
};

exports.getProcurement = async (req, res, next) => {
  try {
    const tenantId = req.user.hostelId || req.user.tenantId || req.user.id;
    const procurement = await aiService.analyzeProcurement(tenantId);
    res.json({ success: true, data: procurement });
  } catch (error) {
    next(error);
  }
};

exports.getPayroll = async (req, res, next) => {
  try {
    const tenantId = req.user.hostelId || req.user.tenantId || req.user.id;
    const payroll = await aiService.analyzePayroll(tenantId);
    res.json({ success: true, data: payroll });
  } catch (error) {
    next(error);
  }
};

exports.getExpenses = async (req, res, next) => {
  try {
    const tenantId = req.user.hostelId || req.user.tenantId || req.user.id;
    const expenses = await aiService.analyzeExpenses(tenantId);
    res.json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
};

exports.getTreasury = async (req, res, next) => {
  try {
    const tenantId = req.user.hostelId || req.user.tenantId || req.user.id;
    const treasury = await aiService.predictTreasury(tenantId);
    res.json({ success: true, data: treasury });
  } catch (error) {
    next(error);
  }
};
