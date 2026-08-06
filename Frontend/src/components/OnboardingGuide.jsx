import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, ArrowRight, Sparkles, Building, BedDouble, Users, Wallet, Palette, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OnboardingGuide({ onDismiss }) {
  const navigate = useNavigate();

  const [steps, setSteps] = useState([
    { id: 1, label: "Complete Owner Profile", desc: "Set up name, contact info & emergency phone", href: "/owner/profile", completed: true },
    { id: 2, label: "Create First Hostel", desc: "Register your hostel property name & address", href: "/owner/dashboard", completed: true },
    { id: 3, label: "Configure Rooms & Beds", desc: "Create rooms and set monthly rent prices", href: "/rooms", completed: true },
    { id: 4, label: "Invite Staff Members", desc: "Assign wardens, cooks, or accountants", href: "/staff", completed: true },
    { id: 5, label: "Add Active Residents", desc: "Register resident admissions and room allocations", href: "/residents", completed: true },
    { id: 6, label: "Record Payment / Collect Rent", desc: "Log rent payments and track outstanding balance", href: "/payments", completed: true },
    { id: 7, label: "Configure White-Label Branding", desc: "Upload logo & theme colors", href: "/owner/branding-settings", completed: false }
  ]);

  const completedCount = steps.filter(s => s.completed).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="p-6 bg-[#162032] border border-[#22304A] rounded-3xl space-y-5 text-white">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#22304A] pb-4">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="text-amber-400" size={20} /> Guided Owner Onboarding Checklist
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Follow this setup guide to get your hostel workspace 100% operational.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-emerald-400">{completedCount} of {steps.length} Steps Completed ({progressPct}%)</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#0B1120] rounded-full h-3 overflow-hidden border border-[#22304A]">
        <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Steps List */}
      <div className="space-y-2.5">
        {steps.map((step) => (
          <div
            key={step.id}
            onClick={() => navigate(step.href)}
            className={`p-3.5 border rounded-2xl flex items-center justify-between cursor-pointer transition ${
              step.completed
                ? "bg-emerald-500/5 border-emerald-500/30 hover:bg-emerald-500/10"
                : "bg-[#0B1120] border-[#22304A] hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              {step.completed ? (
                <CheckCircle2 className="text-emerald-400 shrink-0" size={18} />
              ) : (
                <Circle className="text-slate-500 shrink-0" size={18} />
              )}
              <div>
                <h4 className={`text-xs font-bold ${step.completed ? "text-slate-200 line-through" : "text-white"}`}>
                  {step.id}. {step.label}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-slate-400 shrink-0" />
          </div>
        ))}
      </div>

    </div>
  );
}
