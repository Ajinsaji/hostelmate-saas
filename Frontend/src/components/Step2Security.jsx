import axios from "axios";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function Step2Security({
  currentStep,
  setCurrentStep,
  token,
  loading,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  handleSave,
}) {
  const passwordError =
    confirmPassword.length > 0 && newPassword !== confirmPassword
      ? "Passwords do not match"
      : "";

  const isPasswordValid =
    newPassword.trim().length >= 8 &&
    !passwordError &&
    confirmPassword.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001a4d] to-[#003d7a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#001a4d]/70 rounded-2xl shadow-2xl p-8 border border-white/10">
          {/* Progress */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    step <= currentStep
                      ? "bg-gradient-to-r from-[#001a4d] to-[#00b894]"
                      : "bg-gray-200"
                  }`}
                ></div>
              ))}
            </div>
            <span className="text-sm font-semibold text-[#FFFFFF] ml-4">
              2/5
            </span>
          </div>

          <h2 className="text-2xl font-bold text-[#FFFFFF] mb-2">
            Security First
          </h2>
          <p className="text-[#FFFFFF]/85 mb-6">
            Set a strong password to secure your account
          </p>

          {/* New Password */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-[#FFFFFF] mb-2">
              New Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 pr-10 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#00b894] focus:border-transparent transition-all"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-white/70 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#FFFFFF] mb-2">
              Confirm Password
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 pr-10 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#00b894] focus:border-transparent transition-all"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-white/70 hover:text-white transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {passwordError ? (
            <p className="text-[#EF4444] text-sm mb-4">{passwordError}</p>
          ) : null}

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex-1 border border-white/20 text-white/90 font-semibold py-3 px-4 rounded-lg hover:bg-white/5 hover:scale-[1.02] transition-all"
            >
              Back
            </button>
            <button
              onClick={() => {
                console.log("Save button clicked");
                console.log("isPasswordValid:", isPasswordValid);
                console.log("loading:", loading);
                console.log("handleSave type:", typeof handleSave);
                handleSave?.();
              }}
              disabled={loading || !isPasswordValid}

              className="flex-1 bg-gradient-to-r from-[#001a4d] to-[#00b894] text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
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

