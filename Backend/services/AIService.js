class AIService {
  async getOverview(workspaceId) {
    return {
      success: true,
      healthScore: 92,
      summary: "Operational efficiency is high. Rent collection efficiency is up 14% this month.",
      keyMetrics: {
        vacancyPrediction: "92% next month",
        churnRisk: "Low (3%)",
        latePaymentRiskCount: 2
      }
    };
  }

  async getRecommendations(workspaceId) {
    return {
      success: true,
      recommendations: [
        {
          id: "rec_1",
          type: "warning",
          title: "Optimize Room Pricing",
          description: "Demand is high for AC Single Sharing rooms. Consider a 5% pricing revision."
        },
        {
          id: "rec_2",
          type: "info",
          title: "Inactive Room Alert",
          description: "Room 204 in Block B has been vacant for 20 days. Create a promotional offer."
        },
        {
          id: "rec_3",
          type: "success",
          title: "Collection Efficiency Up",
          description: "Digital rent collections increased by 14% this month via automated reminders."
        }
      ]
    };
  }

  async getPredictions(workspaceId) {
    return {
      success: true,
      predictions: {
        vacancyRateNextMonth: 8,
        expectedOccupancy: 92,
        churnProbability: 0.04,
        renewalProbability: 0.96,
        highRiskResidents: [
          { name: "Siddharth Verma", room: "201", reason: "Repeated payment delay (>7 days)" },
          { name: "Kavita Rao", room: "105", reason: "Notice period query logged" }
        ]
      }
    };
  }
}

module.exports = new AIService();
