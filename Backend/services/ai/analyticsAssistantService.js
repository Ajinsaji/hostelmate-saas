const AIProviderFactory = require("./AIProviderFactory");
const AIConversation = require("../../models/AIConversation");
const RentInvoice = require("../../models/RentInvoice");

/**
 * Handle natural language queries, storing history in AIConversation.
 */
async function processNaturalLanguageQuery(tenantId, userId, query) {
  // 1. Gather context data (in a real advanced implementation, context gathering is iterative or tool-based inside the provider)
  // For Phase 10 heuristic fallback, we pass some basic context data.
  const unpaidInvoices = await RentInvoice.find({ hostelId: tenantId, status: "Unpaid" }).lean();
  
  const contextData = {
    unpaidInvoices,
    occupancyRate: 85, // Mapped statically for fallback illustration
  };

  // 2. Delegate to AI Provider
  const provider = await AIProviderFactory.getProvider(tenantId);
  const result = await provider.processQuery(query, contextData);

  // 3. Log the conversation
  await AIConversation.create({
    tenantId,
    userId,
    prompt: query,
    intent: result.intent,
    resultSummary: result.text,
    provider: provider.name,
    tokensUsed: 0, // Heuristic uses 0 tokens
  });

  return result;
}

module.exports = { processNaturalLanguageQuery };
