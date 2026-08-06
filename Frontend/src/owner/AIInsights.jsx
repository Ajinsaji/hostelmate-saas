import React, { useState, useEffect } from "react";
import { Sparkles, AlertTriangle, CheckCircle, Info, RefreshCcw, TrendingUp, ShieldAlert, Zap } from "lucide-react";
import api from "../utils/apiClient";
import { useTheme } from "../design-system/ThemeProvider";

export default function AIInsights() {
  const { colors, spacing, radius, typography } = useTheme();
  const [overview, setOverview] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAIData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ovRes, recRes, predRes] = await Promise.all([
        api.get("/api/v2/ai/overview"),
        api.get("/api/v2/ai/recommendations"),
        api.get("/api/v2/ai/predictions")
      ]);

      if (ovRes.data?.success) setOverview(ovRes.data);
      if (recRes.data?.success) setRecommendations(recRes.data.recommendations || []);
      if (predRes.data?.success) setPredictions(predRes.data.predictions);
    } catch (err) {
      console.error(err);
      setError("Unable to load AI predictions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAIData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-[#162032] border border-[#22304A] rounded-3xl animate-pulse space-y-3">
        <div className="h-6 w-48 bg-white/5 rounded" />
        <div className="h-16 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#162032] border border-[#22304A] rounded-3xl text-center text-slate-400 space-y-3">
        <p>{error}</p>
        <button onClick={fetchAIData} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2">
          <RefreshCcw size={14} /> Retry AI Engine
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* AI Overview Banner */}
      {overview && (
        <div className="p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-emerald-900/20 backdrop-blur-md space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Sparkles className="text-purple-400" size={18} /> HostelMate AI Intelligence Engine
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Confidence 98%
            </span>
          </div>
          <p className="text-sm text-slate-300">{overview.summary}</p>
          
          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Vacancy Prediction</span>
              <span className="text-emerald-400 font-bold mt-0.5 block">{overview.keyMetrics?.vacancyPrediction}</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Resident Churn Risk</span>
              <span className="text-blue-400 font-bold mt-0.5 block">{overview.keyMetrics?.churnRisk}</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Delay Alerts</span>
              <span className="text-amber-400 font-bold mt-0.5 block">{overview.keyMetrics?.latePaymentRiskCount} Residents</span>
            </div>
          </div>
        </div>
      )}

      {/* Predictions Section */}
      {predictions && (
        <div className="bg-[#162032] border border-[#22304A] p-6 rounded-3xl space-y-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="text-amber-400" size={16} /> Late Payment Risk & Predictive Churn Analysis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {predictions.highRiskResidents?.map((res, idx) => (
              <div key={idx} className="p-3 bg-[#0B1120] border border-[#22304A] rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-white">{res.name} (Room {res.room})</p>
                  <p className="text-slate-400 mt-0.5">{res.reason}</p>
                </div>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full font-bold text-[10px]">
                  High Risk
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Smart Operational Recommendations</h4>
        <div className="space-y-2">
          {recommendations.map((rec, index) => {
            const isWarning = rec.type === "warning";
            const isSuccess = rec.type === "success";
            const Icon = isWarning ? AlertTriangle : isSuccess ? CheckCircle : Info;
            return (
              <div key={index} className="p-4 bg-[#162032] border border-[#22304A] rounded-2xl flex items-start gap-3 text-xs">
                <div className={`p-2 rounded-xl mt-0.5 ${isWarning ? "bg-amber-500/20 text-amber-300" : isSuccess ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-white text-sm">{rec.title}</h5>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">{rec.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
