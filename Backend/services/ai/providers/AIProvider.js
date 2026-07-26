/**
 * Abstract Interface for AI Providers.
 * All providers (Heuristic, Gemini, OpenAI, etc.) must implement these methods.
 */
class AIProvider {
  /**
   * Initialize the provider with settings.
   */
  constructor(settings = {}) {
    this.settings = settings;
  }

  /**
   * Process a natural language query and return structured data, chart config, and text explanation.
   * @param {String} query - The user's prompt.
   * @param {Object} contextData - Background operational data (e.g. from analytics service) needed for context.
   * @returns {Promise<Object>} { text: String, structuredData: Object, chart: Object, confidence: Number }
   */
  async processQuery(query, contextData = {}) {
    throw new Error("processQuery() must be implemented by provider");
  }

  /**
   * Analyze anomalies within a dataset.
   * @param {String} domain - The domain (e.g., 'Payroll', 'Expense')
   * @param {Array} data - Array of records
   * @returns {Promise<Array>} Array of anomaly objects
   */
  async detectAnomalies(domain, data) {
    throw new Error("detectAnomalies() must be implemented by provider");
  }

  /**
   * Generate predictions/forecasts based on historical data.
   * @param {String} domain - The domain (e.g., 'Occupancy', 'Revenue')
   * @param {Object} historicalData - Relevant historical metrics
   * @returns {Promise<Object>} Forecast output
   */
  async generateForecast(domain, historicalData) {
    throw new Error("generateForecast() must be implemented by provider");
  }
}

module.exports = AIProvider;
