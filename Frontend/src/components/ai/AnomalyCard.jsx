import { AlertTriangle, Info } from "lucide-react";

export default function AnomalyCard({ anomaly }) {
  const { description, severity, recordId } = anomaly;
  
  const isHigh = severity === "High" || severity === "Critical";
  const bg = isHigh ? "bg-rose-500/10 border-rose-500/20" : "bg-amber-500/10 border-amber-500/20";
  const iconColor = isHigh ? "text-rose-400" : "text-amber-400";
  const textColor = isHigh ? "text-rose-200" : "text-amber-200";

  return (
    <div className={`flex items-start p-3 border rounded-xl mb-2 ${bg}`}>
      <div className={`mt-0.5 mr-3 ${iconColor}`}>
        {isHigh ? <AlertTriangle size={18} /> : <Info size={18} />}
      </div>
      <div>
        <p className={`text-sm font-medium ${textColor}`}>{description}</p>
        {recordId && (
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide">
            Ref: {recordId.substring(0, 8)}...
          </p>
        )}
      </div>
    </div>
  );
}
