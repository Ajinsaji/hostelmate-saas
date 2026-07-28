import { Activity, ShieldCheck, AlertTriangle } from "lucide-react";

export default function InsightScoreCard({ score, title = "Platform Health Score", subtitle = "Based on aggregate AI insights" }) {
  const isHealthy = score >= 80;
  const isWarning = score >= 50 && score < 80;
  
  const color = isHealthy ? "text-emerald-400" : isWarning ? "text-amber-400" : "text-rose-400";
  const bg = isHealthy ? "bg-emerald-500/10 border-emerald-500/20" : isWarning ? "bg-amber-500/10 border-amber-500/20" : "bg-rose-500/10 border-rose-500/20";

  return (
    <div className={`p-6 rounded-2xl border flex items-center justify-between shadow-lg ${bg}`}>
      <div>
        <h2 className="text-white font-bold text-xl">{title}</h2>
        <p className="text-sm text-slate-300 mt-1">{subtitle}</p>
        <div className="mt-4 flex items-center space-x-2">
          {isHealthy ? (
            <ShieldCheck className="text-emerald-400" size={20} />
          ) : isWarning ? (
            <Activity className="text-amber-400" size={20} />
          ) : (
            <AlertTriangle className="text-rose-400" size={20} />
          )}
          <span className={`font-semibold ${color}`}>
            {isHealthy ? "Optimal" : isWarning ? "Needs Attention" : "Critical Risk"}
          </span>
        </div>
      </div>
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-white/10"
            strokeWidth="3"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={color}
            strokeDasharray={`${score}, 100`}
            strokeWidth="3"
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{score}</span>
        </div>
      </div>
    </div>
  );
}
