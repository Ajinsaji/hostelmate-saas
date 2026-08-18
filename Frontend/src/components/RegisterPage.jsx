import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import SharedRegistrationWizard from "./SharedRegistrationWizard";

export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex flex-col">
      {/* Public Registration Navigation Bar */}
      <header className="bg-[#131C2E] border-b border-[#202B45] px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            HM
          </div>
          <div>
            <span className="font-bold text-white text-base block tracking-tight">HostelMate SaaS</span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold block">Public Owner Onboarding</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-2 min-h-[40px]"
        >
          <ArrowLeft size={16} /> Back to Login
        </button>
      </header>

      {/* Shared Canonical Registration Wizard (mode="public") */}
      <main className="flex-1">
        <SharedRegistrationWizard mode="public" showPageHeader={true} />
      </main>
    </div>
  );
}

export default RegisterPage;
