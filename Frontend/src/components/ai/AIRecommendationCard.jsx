import { Check, X } from "lucide-react";
import { useTheme } from "../../design-system/ThemeProvider";

export default function AIRecommendationCard({ recommendation, onAccept, onDismiss }) {
  const { colors } = useTheme();
  const { category, priority, confidence, recommendedAction, explanation } = recommendation;
  
  const priorityStyles = {
    Low: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    High: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    Critical: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  };

  return (
    <div 
      className="border rounded-2xl p-4 shadow-lg hover:border-white/20 transition-all"
      style={{ backgroundColor: colors.background.card, borderColor: colors.border.default }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${priorityStyles[priority] || "bg-white/10 text-slate-300 border-white/10"}`}>
          {priority} Priority
        </span>
        <span className="text-xs text-slate-400 font-medium bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
          {category}
        </span>
      </div>
      
      <h3 className="font-semibold text-white text-base mb-1">{recommendedAction}</h3>
      <p className="text-sm text-slate-300 mb-3 line-clamp-2">{explanation}</p>
      
      <div className="flex items-center justify-between mt-4">
        <div className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
          {confidence}% Confidence
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => onDismiss(recommendation._id)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            title="Dismiss Recommendation"
          >
            <X size={18} />
          </button>
          <button 
            onClick={() => onAccept(recommendation._id)}
            className="p-1.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors cursor-pointer"
            title="Accept & Execute"
          >
            <Check size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
