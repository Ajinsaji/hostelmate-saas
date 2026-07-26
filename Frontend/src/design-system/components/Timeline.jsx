import React from "react";
import clsx from "clsx";
import { Card } from "./Card";

/**
 * Enterprise Timeline Component
 * @param {Array} events - Array of { id, title, description, timestamp, icon: Icon, type: 'success' | 'warning' | 'info' | 'danger' | 'default' }
 */
export default function Timeline({ events }) {
  const getColorClasses = (type) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-600 border-green-200";
      case "warning":
        return "bg-amber-100 text-amber-600 border-amber-200";
      case "danger":
        return "bg-rose-100 text-rose-600 border-rose-200";
      case "info":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "primary":
        return "bg-[#6C4CF5]/10 text-[#6C4CF5] border-[#6C4CF5]/20";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 text-sm">
        No timeline events available.
      </div>
    );
  }

  return (
    <div className="relative pl-4 border-l-2 border-gray-100 ml-4 space-y-8 py-4">
      {events.map((event, index) => {
        const Icon = event.icon;
        const colorClasses = getColorClasses(event.type);
        
        return (
          <div key={event.id || index} className="relative">
            {/* Timeline Dot/Icon */}
            <div
              className={clsx(
                "absolute -left-[27px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white shadow-sm z-10",
                colorClasses
              )}
            >
              {Icon && <Icon size={14} strokeWidth={2.5} />}
            </div>

            {/* Content */}
            <div className="pl-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-1">
                <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                <span className="text-xs font-medium text-gray-400">
                  {new Date(event.timestamp).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              
              {event.description && (
                <p className="text-sm text-gray-500 leading-relaxed">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
