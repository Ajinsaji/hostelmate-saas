const InventoryItem = require("../../models/InventoryItem");
const KitchenPurchase = require("../../models/KitchenPurchase");
const AIProviderFactory = require("./AIProviderFactory");

async function analyzeProcurement(tenantId) {
  // 1. Fetch data
  const inventory = await InventoryItem.find({ hostelId: tenantId }).lean();
  
  // 2. Mock some analysis for heuristic provider
  // e.g. items running low or consumed quickly
  const recommendations = [];
  inventory.forEach(item => {
    if (item.currentStock <= (item.minimumStockLevel || 10)) {
      recommendations.push({
        itemId: item._id,
        itemName: item.name,
        optimalReorderDate: new Date().toISOString().split('T')[0], // Today
        quantityRecommendation: (item.maximumStockLevel || 50) - item.currentStock,
        preferredVendor: item.vendorId || "Primary Vendor",
        potentialCostSavings: "Bulk order discount potential",
        priority: "High",
      });
    }
  });

  const provider = await AIProviderFactory.getProvider(tenantId);

  return {
    overview: {
      itemsToReorder: recommendations.length,
      criticalShortages: recommendations.filter(r => r.quantityRecommendation > 20).length,
    },
    recommendations,
    confidence: 85,
    generatedAt: new Date(),
    modelVersion: provider.name,
  };
}

module.exports = { analyzeProcurement };
