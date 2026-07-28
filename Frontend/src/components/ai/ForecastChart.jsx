import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function ForecastChart({ title, current, forecast, unit = "", trend = "up" }) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-slate-400";

  return (
    <div className="bg-[#132235] border border-white/10 rounded-2xl p-5 shadow-lg">
      <h3 className="text-slate-400 text-sm font-medium mb-4">{title}</h3>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-white">
            {unit === "$" ? "₹" : ""}{current}{unit !== "$" ? unit : ""}
          </p>
          <p className="text-sm text-slate-400 mt-1">Current</p>
        </div>
        <div className="text-right">
          <div className={`flex items-center justify-end space-x-1 ${trendColor}`}>
            <TrendIcon size={18} />
            <span className="text-lg font-bold">
              {unit === "$" ? "₹" : ""}{forecast}{unit !== "$" ? unit : ""}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">30-Day Forecast</p>
        </div>
      </div>
      
      {/* Visual Bar representation */}
      <div className="mt-4 h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
        <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.min(100, (current / (Math.max(current, forecast) || 1)) * 100)}%` }}></div>
      </div>
    </div>
  );
}
