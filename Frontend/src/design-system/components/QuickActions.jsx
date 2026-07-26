import { ArrowRight } from "lucide-react";
import { colors } from "../tokens/colors";
import { typography } from "../tokens/typography";
import { radius } from "../tokens/radius";

export function QuickActions({ actions = [] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {actions.map((action, idx) => (
        <button 
          key={idx}
          onClick={action.onClick}
          className="flex items-center justify-between p-3 text-left w-full transition-transform active:scale-95"
          style={{ 
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md
          }}
        >
          <span className="inline-flex items-center gap-3">
            <span 
              className="flex h-10 w-10 items-center justify-center rounded-2xl" 
              style={{ background: `${colors.primary}14`, color: colors.primary }}
            >
              {action.icon}
            </span>
            <span 
              style={{ 
                fontFamily: typography.fontFamily, 
                fontWeight: typography.weights.medium,
                color: colors.textPrimary
              }}
            >
              {action.label}
            </span>
          </span>
          <ArrowRight size={16} style={{ color: colors.textMuted }} />
        </button>
      ))}
    </div>
  );
}
