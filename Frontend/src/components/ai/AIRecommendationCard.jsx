import React from "react";
import { Check, X } from "lucide-react";

export default function AIRecommendationCard({ recommendation, onAccept, onDismiss }) {
  const { category, priority, confidence, recommendedAction, explanation } = recommendation;
  
  const priorityColors = {
    Low: "bg-blue-100 text-blue-800",
    Medium: "bg-yellow-100 text-yellow-800",
    High: "bg-orange-100 text-orange-800",
    Critical: "bg-red-100 text-red-800",
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${priorityColors[priority] || "bg-gray-100"}`}>
          {priority} Priority
        </span>
        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
          {category}
        </span>
      </div>
      
      <h3 className="font-semibold text-gray-900 text-base mb-1">{recommendedAction}</h3>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{explanation}</p>
      
      <div className="flex items-center justify-between mt-4">
        <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
          {confidence}% Confidence
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => onDismiss(recommendation._id)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Dismiss Recommendation"
          >
            <X size={18} />
          </button>
          <button 
            onClick={() => onAccept(recommendation._id)}
            className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
            title="Accept & Execute"
          >
            <Check size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
