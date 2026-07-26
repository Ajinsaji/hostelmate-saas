import React from "react";
import { AlertTriangle, Info } from "lucide-react";

export default function AnomalyCard({ anomaly }) {
  const { description, severity, recordId } = anomaly;
  
  const isHigh = severity === "High" || severity === "Critical";
  const bg = isHigh ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200";
  const iconColor = isHigh ? "text-red-500" : "text-yellow-500";
  const textColor = isHigh ? "text-red-800" : "text-yellow-800";

  return (
    <div className={`flex items-start p-3 border rounded-md mb-2 ${bg}`}>
      <div className={`mt-0.5 mr-3 ${iconColor}`}>
        {isHigh ? <AlertTriangle size={18} /> : <Info size={18} />}
      </div>
      <div>
        <p className={`text-sm font-medium ${textColor}`}>{description}</p>
        {recordId && (
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
            Ref: {recordId.substring(0, 8)}...
          </p>
        )}
      </div>
    </div>
  );
}
