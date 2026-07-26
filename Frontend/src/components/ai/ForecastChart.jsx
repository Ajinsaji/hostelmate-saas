import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function ForecastChart({ title, current, forecast, unit = "", trend = "up" }) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-gray-500";

  return (
    <div className="bg-white border rounded-lg p-5 shadow-sm">
      <h3 className="text-gray-500 text-sm font-medium mb-4">{title}</h3>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">
            {unit === "$" ? "$" : ""}{current}{unit !== "$" ? unit : ""}
          </p>
          <p className="text-sm text-gray-500 mt-1">Current</p>
        </div>
        <div className="text-right">
          <div className={`flex items-center justify-end space-x-1 ${trendColor}`}>
            <TrendIcon size={18} />
            <span className="text-lg font-bold">
              {unit === "$" ? "$" : ""}{forecast}{unit !== "$" ? unit : ""}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">30-Day Forecast</p>
        </div>
      </div>
      
      {/* Visual Bar representation */}
      <div className="mt-4 h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
        <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(100, (current / (Math.max(current, forecast) || 1)) * 100)}%` }}></div>
      </div>
    </div>
  );
}
