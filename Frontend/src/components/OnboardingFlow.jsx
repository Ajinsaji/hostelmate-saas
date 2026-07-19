import { useState, useEffect, useMemo, memo } from "react";

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CheckCircle,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { getOwnerToken, getStoredOwner, setStoredOwner } from "../utils/authToken";

const HOSTELMATE_GREEN = "#00b894";

// ============================================================================
// Shared Components (stable references, defined outside main component)
// ============================================================================

const PremiumCardLayout = ({ children, topLeftAction }) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(0,184,148,0.2),_transparent_40%),linear-gradient(135deg,_#030b16_0%,_#071d3d_55%,_#06264f_100%)] px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[860px] items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#071425] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,184,148,0.15),_transparent_35%)]" />
          <div className={`relative ${topLeftAction ? "pt-14 sm:pt-16" : ""}`}>{children}</div>
          {topLeftAction ? <div className="absolute left-4 top-4 z-10">{topLeftAction}</div> : null}
        </div>
      </div>
    </div>
  );
};

const Header = ({ step, title, description }) => {
  const progress = (step / 5) * 100;

  return (
    <div className="mb-7 rounded-[1.6rem] border border-white/10 bg-slate-900/80 p-4 shadow-[0_16px_45px_rgba(2,8,23,0.28)] backdrop-blur sm:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">Owner Setup</div>
          <div className="mt-1 text-xl font-bold text-white">Step {step} of 5</div>
          <div className="mt-1 text-sm text-slate-300 md:text-base">{description}</div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-slate-800/80 px-3 py-1.5 text-sm font-semibold text-slate-100 shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: HOSTELMATE_GREEN }} aria-hidden />
          {title}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          <span>Progress</span>
          <span>{step}/5</span>
        </div>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-valuetext={`Step ${step} of 5`}
          aria-label="Onboarding progress"
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: HOSTELMATE_GREEN }}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        </div>

        <div className="mt-3 grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((s) => {
            const state = s < step ? "completed" : s === step ? "current" : "upcoming";
            const dotClass =
              state === "completed"
                ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(0,184,148,0.16)]"
                : state === "current"
                  ? "shadow-[0_0_0_4px_rgba(0,184,148,0.16)]"
                  : "bg-slate-700";
            const dotStyle = state === "current" ? { backgroundColor: HOSTELMATE_GREEN } : undefined;

            return (
              <div key={s} className="flex flex-col items-center">
                <div className={`h-2.5 w-2.5 rounded-full transition-all ${dotClass}`} style={dotStyle} aria-hidden />
                <div className="mt-1 hidden text-[11px] font-semibold text-slate-500 sm:block">
                  {state === "completed" ? "Completed" : state === "current" ? "Current" : "Upcoming"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Button = ({ variant = "primary", disabled, loading, onClick, type = "button", children }) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00b894] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

  if (variant === "secondary") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${base} w-full border border-white/10 bg-slate-900/90 px-4 py-3 text-slate-100 hover:border-emerald-400/40 hover:bg-slate-800 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : null}
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} w-full bg-gradient-to-r from-[#002f5f] via-[#0a4d7d] to-[#00b894] px-4 py-3 text-white shadow-lg shadow-emerald-900/20 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {loading ? <Loader2 className="animate-spin" size={18} /> : null}
      {children}
    </button>
  );
};

const Input = ({ id, label, required, type = "text", value, onChange, placeholder, autoComplete, min, max, description, ariaInvalid = false, ariaDescribedBy, rightSlot }) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-100">
        {label}
        {required ? <span className="ml-1 text-rose-400">*</span> : null}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          min={min}
          max={max}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          className={`mt-2 w-full rounded-2xl border bg-slate-900/80 px-4 py-3 pr-12 text-slate-100 placeholder-slate-500 shadow-inner outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 ${ariaInvalid ? "border-rose-400/45" : "border-white/10"}`}
        />
        {rightSlot ? <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div> : null}
      </div>
      {description ? <p id={ariaDescribedBy} className="mt-2 text-sm text-slate-400">{description}</p> : null}
    </div>
  );
};

const Textarea = ({ id, label, required, value, onChange, placeholder, rows = 10, maxLength, description, ariaDescribedBy }) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-100">
        {label}
        {required ? <span className="ml-1 text-rose-400">*</span> : null}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        aria-describedby={ariaDescribedBy}
        className="mt-2 min-h-[240px] w-full resize-none overflow-auto rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-slate-100 shadow-inner outline-none transition focus:border-emerald-400 focus:bg-slate-900 focus:ring-2 focus:ring-emerald-400/20"
      />
      {description ? <p id={ariaDescribedBy} className="mt-2 text-sm text-slate-400">{description}</p> : null}
    </div>
  );
};

// ============================================================================
// Step Content Components (memoized to prevent remounts)
// ============================================================================

const Step1Content = memo(({ storedOwner, onContinue }) => {
  const ownerName = storedOwner?.ownerName || "Owner";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
    >
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 shadow-sm">
          <Sparkles size={16} className="text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-300">Owner onboarding, elevated</span>
        </div>

        <h1 className="mt-5 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          Welcome back, {ownerName} 👋
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
          Let&apos;s finish setting up your hostel with a polished experience that feels as premium as the rest of HostelMate.
        </p>

        <div className="mt-8 max-w-sm">
          <Button onClick={onContinue} disabled={false} loading={false}>
            Continue setup <ArrowRight size={18} />
          </Button>
        </div>

        <div className="mt-5 rounded-[1.2rem] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200 shadow-sm">
          Your progress is saved automatically so you can resume anytime across devices.
        </div>

        <div className="mt-6 rounded-[1.35rem] border border-white/10 bg-slate-900/70 p-4 shadow-[0_18px_45px_rgba(2,8,23,0.24)]">
          <div className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">Progress snapshot</div>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle size={16} className="text-emerald-400" />
            Secure your account
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle size={16} className="text-emerald-400" />
            Set house rules
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle size={16} className="text-emerald-400" />
            Add rooms and beds
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_20px_60px_rgba(2,8,23,0.28)]"
      >
        <div className="flex items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[1.5rem] shadow-lg" style={{ backgroundColor: HOSTELMATE_GREEN }}>
            <Home size={36} className="text-white" />
          </div>
        </div>

        <ul className="mt-6 space-y-3 text-sm text-slate-200">
          <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-800/80 px-3 py-3 shadow-sm">
            <ShieldCheck className="mt-0.5 text-emerald-400" size={18} />
            <span className="font-semibold">Secure your owner account</span>
          </li>
          <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-800/80 px-3 py-3 shadow-sm">
            <KeyRound className="mt-0.5 text-emerald-400" size={18} />
            <span className="font-semibold">Set house rules</span>
          </li>
          <li className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-800/80 px-3 py-3 shadow-sm">
            <Sparkles className="mt-0.5 text-emerald-400" size={18} />
            <span className="font-semibold">Add rooms and bed counts</span>
          </li>
        </ul>

        <div className="mt-6 rounded-[1.25rem] border border-emerald-400/20 bg-slate-950/90 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm">
          <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Powered by</div>
          <div className="mt-1 text-emerald-300">BetaMind TechSolutions</div>
          <div className="mt-1 text-xs font-medium text-slate-400">Building smarter hostel management.</div>
        </div>
      </motion.div>
    </motion.div>
  );
});
Step1Content.displayName = "Step1Content";

const Step2Content = memo(
  ({
    newPassword,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    onPasswordChange,
    onConfirmPasswordChange,
    onShowPasswordToggle,
    onShowConfirmPasswordToggle,
    onBack,
    onSave,
    loading,
  }) => {
    const passwordError =
      confirmPassword.length > 0 && newPassword !== confirmPassword ? "Passwords do not match" : "";

    const strength = useMemo(() => {
      const p = newPassword;
      if (!p) return 0;
      let score = 0;
      if (p.length >= 8) score += 1;
      if (/[A-Z]/.test(p)) score += 1;
      if (/[0-9]/.test(p)) score += 1;
      if (/[^A-Za-z0-9]/.test(p)) score += 1;
      return Math.min(4, score);
    }, [newPassword]);

    const strengthLabel =
      strength <= 1 ? "Weak" : strength === 2 ? "Good" : strength === 3 ? "Strong" : "Very strong";
    const isPasswordValid =
      newPassword.trim().length >= 8 && !passwordError && confirmPassword.trim().length > 0;

    const requirements = [
      { ok: newPassword.trim().length >= 8, text: "At least 8 characters" },
      { ok: /[A-Z]/.test(newPassword), text: "Contains an uppercase letter" },
      { ok: /[0-9]/.test(newPassword), text: "Contains a number" },
      { ok: /[^A-Za-z0-9]/.test(newPassword), text: "Contains a symbol" },
      { ok: newPassword === confirmPassword && confirmPassword.length > 0, text: "Passwords match" },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Secure your account</h2>
            <p className="mt-2 text-slate-300">
              A strong password keeps your hostel data protected and gives you peace of mind.
            </p>
          </div>
          <div className="rounded-[1.1rem] border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-right shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Strength</div>
            <div className="text-lg font-extrabold text-emerald-300">{strengthLabel}</div>
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-4 shadow-[0_16px_45px_rgba(2,8,23,0.22)] sm:p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-200">Password strength</div>
            <div className="text-xs font-semibold text-slate-400">{strength}/4</div>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800" aria-hidden>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: HOSTELMATE_GREEN }}
              initial={false}
              animate={{ width: `${(strength / 4) * 100}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>

          <ul className="mt-4 space-y-2">
            {requirements.map((item) => (
              <motion.li key={item.text} layout className="flex items-center gap-2 text-sm">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: item.ok ? "rgba(0,184,148,0.15)" : "rgba(107,114,128,0.15)",
                    color: item.ok ? HOSTELMATE_GREEN : "#94a3b8",
                  }}
                  aria-hidden
                >
                  {item.ok ? <CheckCircle size={14} /> : <span className="h-2 w-2 rounded-full bg-slate-500" />}
                </span>
                <span className={item.ok ? "font-semibold text-slate-100" : "text-slate-400"}>{item.text}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-4 shadow-[0_16px_45px_rgba(2,8,23,0.22)] sm:p-5">
          <Input
            id="newPassword"
            label="New Password"
            required
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Enter a new password"
            autoComplete="new-password"
            description="Use a mix of letters, numbers, and symbols for a stronger password."
            ariaDescribedBy="password-help"
            ariaInvalid={Boolean(passwordError)}
            rightSlot={
              <button
                type="button"
                onClick={() => onShowPasswordToggle(!showPassword)}
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-slate-300 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <Input
            id="confirmPassword"
            label="Confirm Password"
            required
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            placeholder="Confirm your password"
            autoComplete="new-password"
            description="Re-enter the same password to confirm it."
            ariaDescribedBy="confirm-password-help"
            ariaInvalid={Boolean(passwordError)}
            rightSlot={
              <button
                type="button"
                onClick={() => onShowConfirmPasswordToggle(!showConfirmPassword)}
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-slate-300 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-pressed={showConfirmPassword}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {passwordError ? (
            <div className="mb-2 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
              {passwordError}
            </div>
          ) : (
            <div className="mb-2 text-sm text-slate-400">Tip: Use a mix of letters, numbers, and symbols.</div>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_2fr]">
          <Button variant="secondary" disabled={loading} loading={false} onClick={onBack}>
            Back
          </Button>
          <Button disabled={!isPasswordValid} loading={loading} onClick={onSave}>
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </motion.div>
    );
  }
);
Step2Content.displayName = "Step2Content";

const Step3Content = memo(({ rules, onRulesChange, onBack, onSave, loading }) => {
  const charCount = rules.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">House rules and expectations</h2>
          <p className="mt-2 text-slate-300">Set clear expectations for residents from day one in a way that&apos;s easy to follow.</p>
        </div>
        <div className="rounded-[1.1rem] border border-white/10 bg-slate-900/80 px-3 py-2 text-right shadow-sm">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Characters</div>
          <div className="text-lg font-extrabold text-emerald-300">{charCount}</div>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-4 shadow-[0_16px_45px_rgba(2,8,23,0.22)] sm:p-5">
        <div className="rounded-[1.25rem] border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          Tip: include quiet hours, guest policy, smoking rules, and maintenance expectations.
        </div>

        <Textarea
          id="hostelRules"
          label="Rules"
          required
          value={rules}
          onChange={(e) => onRulesChange(e.target.value)}
          placeholder="Example: Quiet hours after 10pm, visitors allowed until 7pm, no smoking in rooms, keep common areas clean, and report maintenance issues promptly."
          rows={10}
          maxLength={4000}
          description="Keep the guidance clear, actionable, and easy to follow."
          ariaDescribedBy="rules-help"
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_2fr]">
        <Button variant="secondary" disabled={loading} loading={false} onClick={onBack}>
          Back
        </Button>
        <Button disabled={loading || !String(rules || "").trim()} loading={loading} onClick={onSave}>
          {loading ? "Saving..." : "Save & Continue"}
        </Button>
      </div>
    </motion.div>
  );
});
Step3Content.displayName = "Step3Content";

const Step4Content = memo(
  ({ rooms, roomName, bedCount, onRoomNameChange, onBedCountChange, onAddRoom, onRemoveRoom, onBack, onSkip, onSave, loading }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div>
          <h2 className="text-2xl font-bold text-white">Configure your rooms</h2>
          <p className="mt-2 text-slate-300">
            Add room names and bed counts to shape your hostel layout in a clean, structured way.
          </p>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-4 shadow-[0_16px_45px_rgba(2,8,23,0.22)] sm:p-5">
          <div className="rounded-[1.25rem] border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            Add a room and its bed count, then continue when you are ready.
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="roomName" className="text-sm font-semibold text-slate-100">
                Room name
              </label>
              <input
                id="roomName"
                type="text"
                value={roomName}
                onChange={(e) => onRoomNameChange(e.target.value)}
                placeholder="e.g., Room A"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 placeholder-slate-500 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                aria-label="Room name"
              />
            </div>
            <div>
              <label htmlFor="bedCount" className="text-sm font-semibold text-slate-100">
                Bed count
              </label>
              <input
                id="bedCount"
                type="number"
                value={bedCount}
                onChange={(e) => onBedCountChange(e.target.value)}
                placeholder="e.g., 8"
                min={1}
                inputMode="numeric"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 placeholder-slate-500 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                aria-label="Bed count"
              />
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={onAddRoom} disabled={false} loading={false}>
              <Plus size={18} /> Add Room
            </Button>
          </div>
        </div>

        <div className="mt-6">
          {rooms.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-900/70 p-8 text-center shadow-sm">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.25rem]"
                style={{ backgroundColor: "rgba(0,184,148,0.12)" }}
              >
                <BedDouble className="text-emerald-400" size={28} />
              </div>
              <div className="mt-4 text-lg font-extrabold text-white">No rooms added yet.</div>
              <div className="mt-2 text-sm text-slate-400">Add your first room to continue.</div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rooms.map((room) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-[1.4rem] border border-white/10 bg-slate-900/80 p-5 shadow-[0_12px_35px_rgba(2,8,23,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(2,8,23,0.28)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                        <Home size={16} className="text-emerald-400" /> Room
                      </div>
                      <div className="mt-2 text-lg font-extrabold text-white">{room.name}</div>
                      <div className="mt-2 text-sm text-slate-300">
                        {room.beds} bed{room.beds > 1 ? "s" : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveRoom(room.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-400/20 text-rose-300 transition hover:bg-rose-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                      aria-label={`Delete ${room.name}`}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_1.2fr]">
          <Button variant="secondary" disabled={loading} loading={false} onClick={onBack}>
            Back
          </Button>
          <Button variant="secondary" disabled={loading} loading={false} onClick={onSkip}>
            Skip
          </Button>
          <Button disabled={loading || rooms.length === 0} loading={loading} onClick={onSave}>
            Continue
          </Button>
        </div>
      </motion.div>
    );
  }
);
Step4Content.displayName = "Step4Content";

const Step5Content = memo(({ loading, onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(0,184,148,0.18)" }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: HOSTELMATE_GREEN }}>
          <CheckCircle className="text-white" size={42} />
        </div>
      </motion.div>

      <h1 className="mt-6 text-3xl font-extrabold text-white sm:text-4xl">Your hostel is ready.</h1>
      <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-300">
        Everything has been configured successfully and your setup is complete.
      </p>

      <div className="mt-8 rounded-[1.5rem] border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200 shadow-sm">
        You can now continue to the dashboard and manage your hostel from a single place.
      </div>

      <div className="mt-8">
        <Button loading={loading} disabled={loading} onClick={onComplete}>
          Go to Dashboard
        </Button>
      </div>
    </motion.div>
  );
});
Step5Content.displayName = "Step5Content";

// ============================================================================
// Main OnboardingFlow Component
// ============================================================================

function OnboardingFlow() {
  const navigate = useNavigate();
  const token = getOwnerToken();
  const storedOwner = getStoredOwner();

  const [backendStepInitialized, setBackendStepInitialized] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showLeaveSetupModal, setShowLeaveSetupModal] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Prevent localStorage from clobbering step transitions during initial hydrate / in-flight saves
  const [isHydrated, setIsHydrated] = useState(false);

  // Step 2: Security
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 3: Rules
  const [rules, setRules] = useState("");

  // Step 4: Rooms & Beds
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [bedCount, setBedCount] = useState("");

  useEffect(() => {
    if (!storedOwner || backendStepInitialized) return;

    const onboardingCompleted = storedOwner?.onboardingCompleted === true;

    if (onboardingCompleted) {
      navigate("/owner/dashboard", { replace: true });
      return;
    }

    const backendStep = storedOwner?.onboardingStep;

    const isBrandNewOwner =
      storedOwner?.firstLogin === true &&
      storedOwner?.mustChangePassword === true &&
      storedOwner?.passwordChanged === false &&
      storedOwner?.rulesConfigured === false &&
      storedOwner?.roomsConfigured === false;

    const nextStep = backendStep == null && isBrandNewOwner ? 1 : backendStep || 1;

    setBackendStepInitialized(true);
    setIsHydrated(true);
    setCurrentStep(nextStep);
  }, [storedOwner, backendStepInitialized, navigate]);

  useEffect(() => {
    if (!isHydrated) return;
    if (loading) return;

    const currentOwnerId = storedOwner?._id || storedOwner?.ownerId;
    if (!currentOwnerId) return;

    const progressData = {
      ownerId: currentOwnerId,
      currentStep,
      timestamp: Date.now(),
      newPassword,
      confirmPassword,
      rules,
      rooms,
    };

    localStorage.setItem("onboardingProgressV2", JSON.stringify(progressData));
  }, [
    isHydrated,
    loading,
    currentStep,
    newPassword,
    confirmPassword,
    rules,
    rooms,
    storedOwner,
  ]);

  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    if (!token || !storedOwner) {
      navigate("/login", { replace: true });
      return;
    }
    setAuthChecked(true);
  }, [token, storedOwner, navigate]);

  if (!authChecked) return null;

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleStep2Save = async () => {
    try {
      if (!newPassword.trim()) {
        toast.error("Enter a new password");
        return;
      }
      if (newPassword.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      const response = await api.put(
        `/api/owner/password/update`,
        { newPassword, confirmPassword }
      );

      if (response?.data?.success) {
        toast.success("Password updated");
        setCurrentStep(3);
      } else {
        toast.error(response?.data?.message || "Failed to update password");
        return;
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Save = async () => {
    if (!String(rules || "").trim()) {
      toast.error("Please enter hostel rules and regulations");
      return;
    }

    setLoading(true);
    try {
      const response = await api.put(
        `/api/owner/onboarding/rules`,
        { rules }
      );

      if (response.data.success) {
        toast.success("Rules saved");
        setCurrentStep(4);
      } else {
        toast.error(response.data.message || "Failed to save rules");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save rules");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = () => {
    if (!roomName.trim()) {
      toast.error("Enter room name");
      return;
    }
    if (!bedCount || bedCount < 1) {
      toast.error("Enter valid bed count");
      return;
    }

    setRooms([...rooms, { id: Date.now(), name: roomName, beds: parseInt(bedCount) }]);
    setRoomName("");
    setBedCount("");
    toast.success("Room added");
  };

  const handleRemoveRoom = (id) => {
    setRooms(rooms.filter((item) => item.id !== id));
  };

  const handleStep4Save = async () => {
    if (rooms.length === 0) {
      toast.error("Add at least one room or skip");
      return;
    }

    setLoading(true);
    try {
      const response = await api.put(
        `/api/owner/onboarding/complete-rooms`,
        { rooms }
      );

      if (response.data.success) {
        toast.success("Rooms configured");
        setCurrentStep(5);
      } else {
        toast.error(response.data.message || "Failed to save rooms");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleStep5Complete = async () => {
    setLoading(true);
    try {
      const response = await api.put(
        `/api/owner/onboarding/complete`,
        {}
      );

      if (response.data.success) {
        const updatedUser = {
          ...storedOwner,
          onboardingCompleted: true,
          firstLogin: false,
        };
        setStoredOwner(updatedUser);

        localStorage.removeItem("onboardingProgress");
        localStorage.removeItem("onboardingProgressV2");

        toast.success("Setup complete!");
        setTimeout(() => {
          navigate("/owner/dashboard", { replace: true });
        }, 300);
      } else {
        toast.error(response.data.message || "Failed to complete onboarding");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // Render
  // ========================================================================

  const activeStepTitle =
    currentStep === 1 ? "Welcome" : currentStep === 2 ? "Security" : currentStep === 3 ? "Rules" : currentStep === 4 ? "Rooms" : "Done";

  const handleBackToLogin = () => {
    if (storedOwner?.onboardingCompleted === true) {
      navigate("/login", { replace: true });
      return;
    }

    setShowLeaveSetupModal(true);
  };

  const handleLeaveSetupConfirm = () => {
    setShowLeaveSetupModal(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <PremiumCardLayout
        topLeftAction={
          <button
            type="button"
            onClick={handleBackToLogin}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur transition hover:border-emerald-400/60 hover:bg-slate-900 hover:text-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          >
            <ArrowLeft size={16} className="text-emerald-400" />
            Back to Login
          </button>
        }
      >
        <Header step={currentStep} title={activeStepTitle} description="Complete your hostel configuration" />
        <div className="mt-8">
          <div className="relative">
            {currentStep === 1 && <Step1Content storedOwner={storedOwner} onContinue={() => setCurrentStep(2)} />}
            {currentStep === 2 && (
              <Step2Content
                newPassword={newPassword}
                confirmPassword={confirmPassword}
                showPassword={showPassword}
                showConfirmPassword={showConfirmPassword}
                onPasswordChange={setNewPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onShowPasswordToggle={setShowPassword}
                onShowConfirmPasswordToggle={setShowConfirmPassword}
                onBack={() => setCurrentStep(1)}
                onSave={handleStep2Save}
                loading={loading}
              />
            )}
            {currentStep === 3 && (
              <Step3Content
                rules={rules}
                onRulesChange={setRules}
                onBack={() => setCurrentStep(2)}
                onSave={handleStep3Save}
                loading={loading}
              />
            )}
            {currentStep === 4 && (
              <Step4Content
                rooms={rooms}
                roomName={roomName}
                bedCount={bedCount}
                onRoomNameChange={setRoomName}
                onBedCountChange={setBedCount}
                onAddRoom={handleAddRoom}
                onRemoveRoom={handleRemoveRoom}
                onBack={() => setCurrentStep(3)}
                onSkip={() => setCurrentStep(5)}
                onSave={handleStep4Save}
                loading={loading}
              />
            )}
            {currentStep === 5 && <Step5Content loading={loading} onComplete={handleStep5Complete} />}
          </div>
        </div>
      </PremiumCardLayout>

      <AnimatePresence>
        {showLeaveSetupModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="leave-setup-title"
              className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[#071425] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.45)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                  <Home size={22} />
                </div>
                <div>
                  <h2 id="leave-setup-title" className="text-xl font-bold text-white">
                    Leave setup?
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Your onboarding progress has already been saved.
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-300">
                Your onboarding progress has already been saved. You can continue later by logging in again.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveSetupModal(false)}
                  className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
                >
                  Stay Here
                </button>
                <button
                  type="button"
                  onClick={handleLeaveSetupConfirm}
                  className="rounded-2xl bg-gradient-to-r from-[#002f5f] via-[#0a4d7d] to-[#00b894] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:shadow-xl"
                >
                  Continue to Login
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default OnboardingFlow;
