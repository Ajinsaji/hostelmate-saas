import { motion } from "framer-motion";

export const PREMIUM_THEME = {
  bg: "#07111F",
  surface: "#0D1B2A",
  card: "#132235",
  border: "rgba(255,255,255,0.08)",
  primary: "#16C47F",
  primaryHover: "#21E18F",
  accent: "#2D9CDB",
  warning: "#F2C94C",
  danger: "#EB5757",
  text: "#F7FAFC",
  muted: "#9BA7B4",
};

export function PageShell({ title, subtitle, action, children, compact = false }) {
  return (
    <div className="min-h-screen pb-28" style={{ background: PREMIUM_THEME.bg, color: PREMIUM_THEME.text }}>
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-4 overflow-hidden rounded-[28px] border p-4 sm:p-6"
          style={{
            background: "linear-gradient(135deg, rgba(22,196,127,0.16), rgba(45,156,219,0.12)), rgba(13,27,42,0.9)",
            borderColor: PREMIUM_THEME.border,
            boxShadow: "0 16px 50px rgba(0,0,0,0.24)",
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: PREMIUM_THEME.primary }}>
                HostelMate
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm" style={{ color: PREMIUM_THEME.muted }}>{subtitle}</p> : null}
            </div>
            {action ? <div>{action}</div> : null}
          </div>
        </motion.header>

        <div className={compact ? "space-y-3" : "space-y-4"}>{children}</div>
      </div>
    </div>
  );
}

export function GlassCard({ children, className = "", style = {}, hover = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-[24px] border p-4 sm:p-5 ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(19,34,53,0.95), rgba(13,27,42,0.9))",
        borderColor: PREMIUM_THEME.border,
        boxShadow: "0 10px 35px rgba(0,0,0,0.24)",
        ...style,
      }}
      whileHover={hover ? { y: -3, scale: 1.01 } : undefined}
    >
      {children}
    </motion.div>
  );
}

export function StatCard({ label, value, caption, icon, tone = "green" }) {
  const accent = tone === "blue" ? PREMIUM_THEME.accent : PREMIUM_THEME.primary;
  return (
    <GlassCard className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          {caption ? <p className="mt-2 text-sm" style={{ color: PREMIUM_THEME.muted }}>{caption}</p> : null}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${accent}16`, color: accent }}>
          {icon}
        </div>
      </div>
    </GlassCard>
  );
}

export function StatusPill({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "rgba(255,255,255,0.06)", text: PREMIUM_THEME.text },
    success: { bg: "rgba(22,196,127,0.16)", text: PREMIUM_THEME.primary },
    warning: { bg: "rgba(242,201,76,0.14)", text: PREMIUM_THEME.warning },
    danger: { bg: "rgba(235,87,87,0.14)", text: PREMIUM_THEME.danger },
    info: { bg: "rgba(45,156,219,0.16)", text: PREMIUM_THEME.accent },
  };
  const style = tones[tone] || tones.neutral;
  return (
    <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: style.bg, color: style.text }}>
      {children}
    </span>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <GlassCard className="text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm" style={{ color: PREMIUM_THEME.muted }}>{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </GlassCard>
  );
}
