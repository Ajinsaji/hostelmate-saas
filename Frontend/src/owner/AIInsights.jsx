import React, { useState, useEffect } from "react";
import api from "../utils/apiClient";
import { toast } from "react-toastify";
import InsightScoreCard from "../components/ai/InsightScoreCard";
import ForecastChart from "../components/ai/ForecastChart";
import AIRecommendationCard from "../components/ai/AIRecommendationCard";
import AnomalyCard from "../components/ai/AnomalyCard";
import AIChatPanel from "../components/ai/AIChatPanel";
import { Loader2 } from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Section } from "../design-system/layouts/Section";

export default function AIInsights() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await api.get("/ai/dashboard");
      if (res.data.success) {
        setInsights(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to load AI Insights.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationAction = async (id, action) => {
    try {
      const res = await api.post(`/ai/recommendations/${id}/action`, { action });
      if (res.data.success) {
        toast.success(res.data.message);
        // Remove from local state
        setInsights(prev => ({
          ...prev,
          recommendations: prev.recommendations.filter(r => r._id !== id)
        }));
      }
    } catch (error) {
      toast.error(`Failed to ${action.toLowerCase()} recommendation.`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="animate-spin mb-4" size={40} style={{ color: colors.accent.primary }} />
        <p style={{ color: colors.text.muted }} className="font-medium">Analyzing enterprise data...</p>
      </div>
    );
  }

  if (!insights) return null;

  const { executiveInsights, predictions, risks, recommendations } = insights;

  return (
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Core Health & Chat */}
        <div className="lg:col-span-1 space-y-6">
          <InsightScoreCard 
            score={executiveInsights?.healthScore || 0} 
            subtitle={`Top Risk: ${executiveInsights?.topRisk || "None"}`} 
          />
          <AIChatPanel />
        </div>

        {/* Middle/Right Columns - Forecasts & Recs */}
        <div className="lg:col-span-2 space-y-6">
          
          <Section>
            <h2 className="text-xl font-bold border-b pb-2 mb-4" style={{ color: colors.text.primary, borderColor: colors.border.default }}>30-Day Forecasts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ForecastChart 
                title="Occupancy Prediction"
                current={predictions?.occupancy?.currentOccupancy}
                forecast={predictions?.occupancy?.predictions?.days30}
                unit="%"
                trend={predictions?.occupancy?.predictions?.days30 >= predictions?.occupancy?.currentOccupancy ? "up" : "down"}
              />
              <ForecastChart 
                title="Revenue Prediction"
                current={(predictions?.revenue?.forecasts?.expectedRentIncomeNextMonth * 0.95).toFixed(0)} // mock current vs next
                forecast={predictions?.revenue?.forecasts?.expectedRentIncomeNextMonth}
                unit="$"
                trend="up"
              />
            </div>
          </Section>

          <Section>
            <h2 className="text-xl font-bold border-b pb-2 mb-4" style={{ color: colors.text.primary, borderColor: colors.border.default }}>Actionable Recommendations</h2>
            {recommendations?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map(rec => (
                  <AIRecommendationCard 
                    key={rec._id} 
                    recommendation={rec}
                    onAccept={(id) => handleRecommendationAction(id, "Accepted")}
                    onDismiss={(id) => handleRecommendationAction(id, "Dismissed")}
                  />
                ))}
              </div>
            ) : (
              <div className="border rounded-2xl p-6 text-center text-sm" style={{ backgroundColor: colors.background.card, borderColor: colors.border.default, color: colors.text.muted }}>
                No pending recommendations at this time.
              </div>
            )}
          </Section>

          <Section>
            <h2 className="text-xl font-bold border-b pb-2 mb-4" style={{ color: colors.text.primary, borderColor: colors.border.default }}>Detected Anomalies</h2>
            <div className="border rounded-2xl p-4" style={{ backgroundColor: colors.background.card, borderColor: colors.border.default }}>
              {risks?.expenses?.anomalies?.length > 0 || risks?.payroll?.anomalies?.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {risks.expenses.anomalies.map((a, i) => <AnomalyCard key={`exp-${i}`} anomaly={a} />)}
                  {risks.payroll.anomalies.map((a, i) => <AnomalyCard key={`pay-${i}`} anomaly={a} />)}
                </div>
              ) : (
                <p className="text-sm text-center py-4" style={{ color: colors.text.muted }}>No anomalies detected in recent datasets.</p>
              )}
            </div>
          </Section>

        </div>
      </div>
    </PageContainer>
  );
}
