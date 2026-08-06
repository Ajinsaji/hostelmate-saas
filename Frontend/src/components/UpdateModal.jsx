import React from "react";
import { Rocket, Check, ArrowRight, X, Sparkles, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UpdateModal({ release, onUpdateNow, onLater, onClose }) {
  const navigate = useNavigate();

  if (!release) return null;

  const isMandatory = release.type === "mandatory";
  const isCritical = release.type === "critical";

  const handleReadMore = () => {
    onLater();
    navigate("/release-notes");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md transition-all duration-200 animate-fadeIn">
      
      {/* Centered Modal Container */}
      <div className="relative w-full max-w-[500px] bg-[#0b1739]/95 border border-[#22304A] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white overflow-hidden transform transition-all scale-100">
        
        {/* Glow Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button (If not mandatory) */}
        {!isMandatory && (
          <button
            onClick={onLater}
            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition"
          >
            <X size={18} />
          </button>
        )}

        {/* Header Icon & Version Badge */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Rocket size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mt-2">HostelMate Updated!</h2>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-400">
            <Sparkles size={14} /> Version {release.version} ({release.type?.toUpperCase()})
          </div>
        </div>

        {/* Short Description */}
        <p className="text-xs sm:text-sm text-slate-300 text-center leading-relaxed">
          {release.description}
        </p>

        {/* Key Highlights Divider */}
        <div className="border-t border-b border-[#22304A]/80 py-4 space-y-2 text-xs">
          {release.newFeatures?.slice(0, 3).map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-slate-200">
              <span className="p-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px]">
                <Check size={12} />
              </span>
              <span className="font-medium">{feat}</span>
            </div>
          ))}
          {release.improvements?.slice(0, 2).map((imp, idx) => (
            <div key={`imp_${idx}`} className="flex items-center gap-2.5 text-slate-200">
              <span className="p-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px]">
                <Check size={12} />
              </span>
              <span className="font-medium">{imp}</span>
            </div>
          ))}
        </div>

        {/* Read More Text Button */}
        <div className="text-center">
          <button
            onClick={handleReadMore}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition"
          >
            Read Full Release Notes <ArrowRight size={14} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {!isMandatory && !isCritical && (
            <button
              onClick={onLater}
              className="w-full sm:w-1/2 py-3 border border-[#22304A] hover:bg-white/5 text-slate-300 font-bold rounded-2xl text-xs transition"
            >
              Remind Later
            </button>
          )}
          <button
            onClick={onUpdateNow}
            className={`w-full ${!isMandatory && !isCritical ? "sm:w-1/2" : "w-full"} py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition`}
          >
            Update Now
          </button>
        </div>

      </div>

    </div>
  );
}
