import React from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useTheme } from "../ThemeProvider";
import { Button } from "./Button";

/**
 * Enterprise FormWizard Component
 * @param {Array} steps - Array of { id, title, description }
 * @param {Number} currentStep - Current 0-based step index
 * @param {Function} onStepChange - Step change handler
 * @param {Function} onSubmit - Final form submission handler
 * @param {Boolean} isSubmitting - Submission loading state
 * @param {React.ReactNode} children - Active step form elements
 */
export function FormWizard({
  steps = [],
  currentStep = 0,
  onStepChange,
  onSubmit,
  isSubmitting = false,
  children
}) {
  const { colors, typography } = useTheme();

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = (e) => {
    e.preventDefault();
    if (!isLastStep) {
      onStepChange(currentStep + 1);
    } else if (onSubmit) {
      onSubmit(e);
    }
  };

  const handleBack = (e) => {
    e.preventDefault();
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Progress Step Bar */}
      <div className="flex items-center justify-between gap-2 border-b pb-4" style={{ borderColor: colors.border.default || "#202B45" }}>
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <React.Fragment key={step.id || idx}>
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => idx <= currentStep && onStepChange(idx)}
              >
                <div 
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted ? "bg-emerald-500 text-slate-950" : isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500" : "bg-white/5 text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check size={14} /> : idx + 1}
                </div>
                <div className="hidden sm:block">
                  <div style={{ fontSize: "12px", fontWeight: typography.weights.bold, color: isActive ? "#FFFFFF" : "#94A3B8" }}>
                    {step.title}
                  </div>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-0.5 rounded bg-white/10" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 2. Step Title & Subtitle */}
      <div>
        <h3 style={{ fontSize: typography.sizes.md || "16px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
        </h3>
        {steps[currentStep]?.description && (
          <p style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8", margin: "2px 0 0" }}>
            {steps[currentStep].description}
          </p>
        )}
      </div>

      {/* 3. Step Form Content */}
      <div className="min-h-[200px]">
        {children}
      </div>

      {/* 4. Progressive Wizard Action Bar */}
      <div className="flex gap-3 pt-4 border-t" style={{ borderColor: colors.border.default || "#202B45" }}>
        {!isFirstStep && (
          <Button variant="secondary" onClick={handleBack} icon={ChevronLeft}>
            Back
          </Button>
        )}

        <div className="flex-1 flex gap-2 justify-end">
          {!isLastStep ? (
            <Button variant="primary" fullWidth onClick={handleNext}>
              Next Step
            </Button>
          ) : (
            <Button type="submit" variant="primary" fullWidth onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Form"}
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}

export default FormWizard;
