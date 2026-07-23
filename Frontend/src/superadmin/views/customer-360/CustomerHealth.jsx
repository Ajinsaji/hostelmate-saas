import React from "react";
import { useParams } from "react-router-dom";
import useHostel from "../../hooks/useHostel";
import { Loader2, AlertCircle, HeartPulse, Activity } from "lucide-react";

export default function CustomerHealth() {
  const { id } = useParams();
  const { data, loading, error } = useHostel(id);

  if (loading) return <div className="p-12 flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin" size={32} /></div>;
  if (error || !data) return <div className="p-12 text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl m-6"><AlertCircle size={32} className="mx-auto mb-2" /> Failed to load health data.</div>;
  
  const score = data.healthScore || 0;
  const isHealthy = score >= 80;
  
  return (
    <div className="p-6">
      <div className="bg-slate-900/50 border border-white/5 p-8 rounded-2xl max-w-3xl flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="shrink-0 relative w-32 h-32 flex items-center justify-center">
          <svg viewBox="0 0 36 36" className="w-full h-full text-slate-800 -rotate-90">
            <path className="stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className={`stroke-current ${isHealthy ? 'text-emerald-500' : 'text-amber-500'}`} strokeDasharray={`${score}, 100`} strokeWidth="3" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-black text-white">{score}</span>
            <span className="text-[10px] text-slate-400">/ 100</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2"><HeartPulse size={20} className={isHealthy ? 'text-emerald-400' : 'text-amber-400'}/> Platform Health Score</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            The health score is calculated based on feature adoption, daily active users (DAU), payment regularity, and support ticket volume.
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
              <span className="text-slate-300">Active Resident Rate</span>
              <span className="font-bold text-white">{data.occupancy?.occupiedBeds || 0} / {data.occupancy?.totalBeds || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
              <span className="text-slate-300">System Uptime</span>
              <span className="font-bold text-emerald-400">99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
