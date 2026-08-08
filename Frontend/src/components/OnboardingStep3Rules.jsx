import { Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useEffect, useRef } from "react";

export default function OnboardingStep3Rules({
  token,
  loading,
  setLoading,
  rules,
  setRules,
  setCurrentStep,
}) {
  const textAreaRef = useRef(null);

  useEffect(() => {
    // Debug: ensure component mount only when step 3 is active
    console.log("[OnboardingStep3Rules] mounted");
    // Keep focus stable while typing
    requestAnimationFrame(() => {
      textAreaRef.current?.focus?.();
    });

    return () => {
      console.log("[OnboardingStep3Rules] unmounted");
    };
  }, []);

  useEffect(() => {
    // Debug: verify step 3 doesn't get re-mounted during typing.
    // Also keep focus stable after rerenders due to rules updates.
    console.log("[OnboardingStep3Rules] rules changed length:", rules?.length);
    // Only re-focus when we still are on this component; the DOM node persists if not remounted.
    // (requestAnimationFrame avoids interfering with the browser caret selection.)
    requestAnimationFrame(() => {
      const el = textAreaRef.current;
      if (!el) return;
      if (document.activeElement !== el) el.focus();
    });
  }, [rules]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/owner/onboarding/rules`,
        { rulesText: String(rules || "").trim() },
        { headers: { Authorization: `Bearer ${token}` } }
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

  const handleSkip = async () => {
    setRules("");
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/owner/onboarding/rules`,
        { rulesText: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      // skip fail-open
    }
    toast.success("Skipped rules step");
    setCurrentStep(4);
  };

  const charCount = (rules || "").length;

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-[#131C2E] border border-[#202B45] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-white">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span>🏠</span> Step 3 of 4
              </div>
              <h2 className="text-xl font-extrabold text-white">Enter Your Hostel Rules</h2>
              <p className="text-xs text-slate-400 mt-1">
                Add the rules and policies you want residents to follow in your hostel.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-[#0B1220] px-3 py-1.5 rounded-full border border-[#202B45]">
              {charCount} / 2000
            </span>
          </div>

          {/* Textarea Field */}
          <div className="space-y-2">
            <label htmlFor="hostelRulesInput" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Hostel Rules
            </label>
            <div className="relative">
              <textarea
                id="hostelRulesInput"
                ref={textAreaRef}
                value={rules || ""}
                onChange={(e) => setRules(e.target.value.slice(0, 2000))}
                placeholder={`Enter your hostel rules here...\n\nExample:\n• Maintain cleanliness in rooms and common areas.\n• No smoking inside the hostel.\n• Visitors are allowed only during permitted hours.\n• Maintain silence after 10 PM.\n• Use electricity and water responsibly.`}
                className="w-full rounded-xl border border-[#202B45] bg-[#0B1220] p-4 text-base text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition min-h-[180px] sm:min-h-[220px] resize-y"
                rows={8}
                maxLength={2000}
              />
              <div className="absolute bottom-3 right-3 text-[11px] font-mono text-slate-500 pointer-events-none">
                {charCount}/2000
              </div>
            </div>
            <div className="text-[11px] text-slate-400 pt-1">
              Powered by <strong className="text-emerald-400">BetaMind Tech Solutions</strong> • Creators of HostelMate
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-xs text-slate-300 hover:text-white bg-white/5 border border-white/10 transition disabled:opacity-40 min-h-[48px]"
            >
              Back
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleSkip}
                disabled={loading}
                className="flex-1 sm:flex-initial px-4 py-3.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white bg-transparent transition disabled:opacity-40 min-h-[48px]"
              >
                Skip for now
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 sm:flex-initial px-6 py-3.5 rounded-xl font-bold text-xs text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition disabled:opacity-40 flex items-center justify-center gap-2 min-h-[48px]"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                Save & Continue →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

