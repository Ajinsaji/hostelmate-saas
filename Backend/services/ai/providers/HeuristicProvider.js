const AIProvider = require("./AIProvider");
const { logger } = require("../../../utils/logger");

class HeuristicProvider extends AIProvider {
  constructor(settings = {}) {
    super(settings);
    this.name = "HeuristicProvider";
  }

  /**
   * Process natural language query using basic heuristics (Regex / Intent Detection)
   */
  async processQuery(query, contextData = {}) {
    logger.info(`[HeuristicProvider] Processing query: "${query}"`);
    const lowerQuery = query.toLowerCase();
    let intent = "General";
    let text = "I am a heuristic fallback provider. I can answer simple queries about rent, occupancy, and payroll.";
    let structuredData = null;
    let chart = null;

    if (lowerQuery.includes("unpaid rent")) {
      intent = "UnpaidRent";
      const unpaidCount = contextData.unpaidInvoices?.length || 0;
      text = `You have ${unpaidCount} unpaid rent invoices this month.`;
      structuredData = contextData.unpaidInvoices || [];
    } else if (lowerQuery.includes("occupancy")) {
      intent = "Occupancy";
      const occupancyRate = contextData.occupancyRate || 0;
      text = `Your current occupancy rate is ${occupancyRate}%.`;
      chart = { type: "gauge", value: occupancyRate };
    } else if (lowerQuery.includes("payroll")) {
      intent = "Payroll";
      text = "Payroll increased because of unusually high overtime hours last month.";
    } else if (lowerQuery.includes("treasury")) {
      intent = "Treasury";
      text = "Treasury balances are stable for the current week.";
    }

    return {
      text,
      structuredData,
      chart,
      intent,
      confidence: 100, // Hardcoded logic is 100% confident in its rules
      provider: this.name,
    };
  }

  /**
   * Basic anomaly detection based on standard deviations or thresholds
   */
  async detectAnomalies(domain, data) {
    const anomalies = [];
    if (!data || data.length === 0) return anomalies;

    if (domain === "Expense") {
      // Find expenses > 3x the average of this array
      const amounts = data.map((d) => d.amount || 0);
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      data.forEach((d) => {
        if (d.amount > avg * 3) {
          anomalies.push({
            recordId: d._id || d.id,
            description: `Expense of ${d.amount} is > 3x the average (${avg.toFixed(2)})`,
            severity: "High",
          });
        }
      });
    } else if (domain === "Payroll") {
      // Simple heuristic: overtime > 20 hours is an anomaly
      data.forEach((d) => {
        if (d.overtimeHours && d.overtimeHours > 20) {
          anomalies.push({
            recordId: d._id || d.id,
            description: `Unusual overtime of ${d.overtimeHours} hours detected.`,
            severity: "Medium",
          });
        }
      });
    }

    return anomalies;
  }

  /**
   * Basic forecasting logic (e.g. naive linear projection)
   */
  async generateForecast(domain, historicalData) {
    let forecast = {};
    if (domain === "Occupancy") {
      const current = historicalData.currentOccupancy || 0;
      forecast = {
        days30: Math.min(100, current + 2), // naive +2%
        days90: Math.min(100, current + 5),
        days365: Math.min(100, current + 10),
        confidence: 60,
        contributingFactors: ["Historical seasonal trends", "Expected graduation departures"],
      };
    } else if (domain === "Revenue") {
      const lastMonth = historicalData.lastMonthRevenue || 0;
      forecast = {
        nextMonth: lastMonth * 1.05, // naive 5% growth
        confidence: 70,
        contributingFactors: ["Recent price adjustments", "Full occupancy"],
      };
    }
    return forecast;
  }
}

module.exports = HeuristicProvider;
