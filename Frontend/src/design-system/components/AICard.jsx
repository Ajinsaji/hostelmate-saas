import { motion } from "framer-motion";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { spacing } from "../tokens/spacing";
import { typography } from "../tokens/typography";
import { shadows } from "../tokens/shadows";
import { Sparkles } from "lucide-react";
import { Button } from "./Button";

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
        background: "rgba(108, 76, 245, 0.15)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(108, 76, 245, 0.25)",
        borderRadius: radius.xxl,
        padding: spacing.xl,
        boxShadow: "0 10px 40px rgba(108, 76, 245, 0.20)",
        boxSizing: "border-box",
      }}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={20} style={{ color: "#8B5CF6" }} />
          <h3 style={{ fontSize: typography.sizes.sectionHeader, fontWeight: typography.weights.bold, fontFamily: typography.fontFamily }}>
            {title}
          </h3>
        </div>

        <div style={{ borderTop: "1px solid rgba(108, 76, 245, 0.25)", marginBottom: spacing.md }} />
        
        <div className="mb-6">
          <h4 style={{ fontSize: typography.sizes.cardTitle, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, fontFamily: typography.fontFamily }}>
            Today's Summary
          </h4>
          <ul className="space-y-2" style={{ listStyleType: "none", paddingLeft: 0 }}>
            {summaryItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2" style={{ fontSize: typography.sizes.body, fontFamily: typography.fontFamily }}>
                <span style={{ color: "#8B5CF6" }}>•</span>
                <span style={{ opacity: 0.9 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ borderTop: "1px solid rgba(108, 76, 245, 0.25)", marginBottom: spacing.md }} />

        <div className="flex flex-col gap-2 mb-6" style={{ fontFamily: typography.fontFamily }}>
          <div className="flex justify-between items-center" style={{ fontSize: typography.sizes.body }}>
            <span style={{ fontWeight: typography.weights.medium }}>Confidence</span>
            <span style={{ fontWeight: typography.weights.bold }}>{confidence}%</span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div 
              className="h-full rounded-full" 
              style={{ width: `${confidence}%`, background: "linear-gradient(90deg, #6C4CF5, #8B5CF6)" }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant="ai"
              fullWidth={false}
              className="px-4 py-1.5"
              style={{
                height: "auto",
                borderRadius: radius.md,
                fontSize: typography.sizes.sm,
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Background decoration */}
      <div 
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
        style={{ background: "rgba(108, 76, 245, 0.12)", filter: "blur(40px)" }}
      />
    </motion.div>
  );
}
