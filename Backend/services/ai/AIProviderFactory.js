const AISettings = require("../../models/AISettings");
const HeuristicProvider = require("./providers/HeuristicProvider");
const { logger } = require("../../utils/logger");

class AIProviderFactory {
  /**
   * Retrieves the appropriately configured AI Provider for a given tenant.
   * Defaults to HeuristicProvider if none is configured or an error occurs.
   * @param {String} tenantId 
   * @returns {Promise<AIProvider>}
   */
  static async getProvider(tenantId) {
    try {
      const settings = await AISettings.findOne({ tenantId });
      
      let providerName = settings?.provider || "HeuristicProvider";
      
      // If the model asks for OpenAI or Gemini but they aren't implemented in Phase 10 yet,
      // we can gracefully fallback to HeuristicProvider if heuristicFallback is true.
      if (providerName !== "HeuristicProvider") {
        if (!settings || settings.heuristicFallback) {
          logger.warn(`[AIProviderFactory] Provider '${providerName}' not fully implemented yet. Falling back to HeuristicProvider for tenant ${tenantId}.`);
          providerName = "HeuristicProvider";
        } else {
           throw new Error(`Provider ${providerName} is not implemented and fallback is disabled.`);
        }
      }

      switch (providerName) {
        case "HeuristicProvider":
          return new HeuristicProvider(settings);
        default:
          return new HeuristicProvider(settings); // Ultimate fallback
      }
    } catch (error) {
      logger.error(`[AIProviderFactory] Error resolving provider for tenant ${tenantId}: ${error.message}`);
      return new HeuristicProvider({});
    }
  }
}

module.exports = AIProviderFactory;
