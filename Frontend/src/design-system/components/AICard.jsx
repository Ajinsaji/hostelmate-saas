import { motion } from "framer-motion";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { spacing } from "../tokens/spacing";
import { typography } from "../tokens/typography";
import { shadows } from "../tokens/shadows";
import { Sparkles } from "lucide-react";

export function AICard({
  title = "HostelMate AI",
  summaryItems = [],
  confidence = 90,
  actions = []
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full text-white overflow-hidden relative"
      style={{
        background: colors.gradients.ai,
        borderRadius: radius.lg,
        padding: spacing.xxl,
        boxShadow: shadows.elevated,
      }}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={20} />
          <h3 style={{ fontSize: typography.sizes.sectionHeader, fontWeight: typography.weights.bold }}>
            {title}
          </h3>
        </div>

        <div style={{ borderTop: `1px solid rgba(255,255,255,0.2)`, marginBottom: spacing.md }} />
        
        <div className="mb-6">
          <h4 style={{ fontSize: typography.sizes.cardTitle, fontWeight: typography.weights.semibold, marginBottom: spacing.sm }}>
            Today's Summary
          </h4>
          <ul className="space-y-2">
            {summaryItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2" style={{ fontSize: typography.sizes.body }}>
                <span>•</span>
                <span style={{ opacity: 0.9 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ borderTop: `1px solid rgba(255,255,255,0.2)`, marginBottom: spacing.md }} />

        <div className="flex flex-col gap-2 mb-6">
          <div className="flex justify-between items-center" style={{ fontSize: typography.sizes.body }}>
            <span style={{ fontWeight: typography.weights.medium }}>Confidence</span>
            <span style={{ fontWeight: typography.weights.bold }}>{confidence}%</span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
            <div 
              className="h-full rounded-full bg-white" 
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="px-4 py-2 font-semibold transition-transform active:scale-95"
              style={{
                background: "white",
                color: colors.primary,
                borderRadius: radius.md,
                fontSize: typography.sizes.body,
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Background decoration */}
      <div 
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
        style={{ background: "rgba(255,255,255,0.1)", filter: "blur(20px)" }}
      />
    </motion.div>
  );
}
