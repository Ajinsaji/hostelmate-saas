import { Sparkles } from "lucide-react";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { spacing } from "../tokens/spacing";
import { typography } from "../tokens/typography";

export function AISearchBar({ 
  placeholder = "Ask HostelMate AI...", 
  value, 
  onChange,
  onKeyPress
}) {
  return (
    <div 
      className="w-full"
      style={{ padding: `0 ${spacing.lg}`, marginBottom: spacing.lg }}
    >
      <div 
        className="flex items-center w-full bg-white relative overflow-hidden"
        style={{
          borderRadius: radius.md,
          border: `1px solid ${colors.border}`,
          padding: "12px 16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}
      >
        <div 
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: colors.gradients.ai }}
        />
        <span className="mr-3 text-lg">🤖</span>
        <input
          type="text"
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none border-none"
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.sizes.body,
            color: colors.textPrimary,
          }}
        />
        <Sparkles size={18} style={{ color: colors.primary }} />
      </div>
    </div>
  );
}
