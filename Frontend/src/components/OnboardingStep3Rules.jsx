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
    if (!String(rules || "").trim()) {
      toast.error("Please enter hostel rules and regulations");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/owner/onboarding/rules`,
        { rules },
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001a4d] to-[#003d7a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Progress */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    step <= 3
                      ? "bg-gradient-to-r from-[#001a4d] to-[#00b894]"
                      : "bg-gray-200"
                  }`}
                ></div>
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-600 ml-4">3/5</span>
          </div>

          <h2 className="text-2xl font-bold text-[#001a4d] mb-2">Rules & Regulations</h2>
          <p className="text-gray-600 mb-6">Set house rules for your residents</p>

          <div className="mb-6">
            <textarea
              ref={textAreaRef}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Enter your hostel's rules and regulations..."
              className="w-full bg-slate-900 text-white placeholder-slate-400 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00b894] resize-none h-40"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#001a4d] to-[#00b894] text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="inline mr-2" size={18} /> : null}
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

