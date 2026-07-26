import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { toast } from "react-toastify";
import InsightScoreCard from "../components/ai/InsightScoreCard";
import ForecastChart from "../components/ai/ForecastChart";
import AIRecommendationCard from "../components/ai/AIRecommendationCard";
import AnomalyCard from "../components/ai/AnomalyCard";
import AIChatPanel from "../components/ai/AIChatPanel";
import { BrainCircuit, Loader2 } from "lucide-react";

export default function AIInsights() {
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
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-gray-500 font-medium">Analyzing enterprise data...</p>
      </div>
    );
  }

  if (!insights) return null;

  const { executiveInsights, predictions, risks, recommendations } = insights;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <BrainCircuit className="text-indigo-600" size={32} />
            <span>AI Insights & Automation</span>
          </h1>
          <p className="text-gray-500 mt-1">Enterprise-grade predictions and anomaly detection.</p>
        </div>
      </div>

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
          
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">30-Day Forecasts</h2>
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

          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mt-8">Actionable Recommendations</h2>
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
            <div className="bg-gray-50 border rounded-lg p-6 text-center text-gray-500">
              No pending recommendations at this time.
            </div>
          )}

          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mt-8">Detected Anomalies</h2>
          <div className="bg-white border rounded-lg p-4">
            {risks?.expenses?.anomalies?.length > 0 || risks?.payroll?.anomalies?.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {risks.expenses.anomalies.map((a, i) => <AnomalyCard key={`exp-${i}`} anomaly={a} />)}
                {risks.payroll.anomalies.map((a, i) => <AnomalyCard key={`pay-${i}`} anomaly={a} />)}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No anomalies detected in recent datasets.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
