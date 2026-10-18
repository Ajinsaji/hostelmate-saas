class AIService {
  async getOverview(workspaceId) {
    return {
      success: false,
      preview: true,
      message: "AI insights are unavailable: no authorized data-backed analysis has been configured.",
    };
  }

  async getRecommendations(workspaceId) {
    return {
      success: false,
      preview: true,
      recommendations: [],
      message: "Recommendations are unavailable until an authorized analysis service is configured.",
    };
  }

  async getPredictions(workspaceId) {
    return {
      success: false,
      preview: true,
      predictions: null,
      message: "Predictions are unavailable until an authorized analysis service is configured.",
    };
  }
}

module.exports = new AIService();
