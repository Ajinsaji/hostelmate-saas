import React, { useState } from "react";
import clsx from "clsx";

/**
 * Enterprise Tabs Component
 * @param {Array} tabs - Array of { id, label, icon: IconComponent, badge: number/string }
 * @param {String} activeTab - Currently active tab id
 * @param {Function} onChange - Callback when tab changes
 */
export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="w-full">
      <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-100">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                "group relative min-w-fit flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors",
                isActive
                  ? "text-[#6C4CF5]"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"
              )}
            >
              {Icon && (
                <Icon
                  size={18}
                  className={clsx(
                    "transition-colors",
                    isActive ? "text-[#6C4CF5]" : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
              )}
              {tab.label}
              
              {tab.badge !== undefined && tab.badge !== null && (
                <span
                  className={clsx(
                    "ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full",
                    isActive
                      ? "bg-[#6C4CF5]/10 text-[#6C4CF5]"
                      : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                  )}
                >
                  {tab.badge}
                </span>
              )}

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C4CF5] rounded-t-full shadow-[0_-2px_10px_rgba(108,76,245,0.4)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
