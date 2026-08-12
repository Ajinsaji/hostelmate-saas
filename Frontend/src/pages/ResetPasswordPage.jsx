import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../services/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const hasLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const isStrong = hasLength && hasUpper && hasLower && hasDigit;
  const matches = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Invalid reset link. Token is missing.");
      return;
    }
    if (!isStrong) {
      toast.error("Password must meet strength requirements.");
      return;
    }
    if (!matches) {
      toast.error("Confirm password does not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/owner/reset-password", {
        token,
        newPassword,
        confirmPassword,
      }).catch(() =>
        api.post("/api/public/owner/reset-password", {
          token,
          newPassword,
          confirmPassword,
        })
      );

      if (res.data?.success) {
        setSuccess(true);
        toast.success("Password reset successfully!");
        setTimeout(() => {
          navigate("/owner/login", { replace: true });
        }, 2000);
      } else {
        toast.error(res.data?.message || "Failed to reset password");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid or expired token. Please request a new reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#16A34A] opacity-[0.05] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#6C4CF5] opacity-[0.05] rounded-full blur-[120px] pointer-events-none" />

      <button
        onClick={() => navigate("/owner/login")}
        className="absolute top-6 left-6 flex items-center gap-2 text-[#CBD5E1] hover:text-white transition-colors bg-[#162032] border border-[#22304A] py-2.5 px-4 rounded-xl shadow-md z-20"
      >
        <ArrowLeft size={16} />
        <span className="text-sm font-medium">Back to Owner Login</span>
      </button>

      <div className="w-full max-w-md bg-[#162032]/95 border border-[#22304A] rounded-2xl shadow-2xl p-8 backdrop-blur-md relative z-10 my-8">
        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-white">Password Reset Complete</h2>
            <p className="text-xs text-slate-300">Your password has been securely updated. Redirecting to login...</p>
            <button
              onClick={() => navigate("/owner/login")}
              className="w-full min-h-[48px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition mt-4"
            >
              Go to Owner Login Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold text-white">Create New Password</h1>
              <p className="text-xs text-slate-400 mt-1">Set a secure password for your Owner account</p>
            </div>

            {!token && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs font-medium mb-5 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                Missing reset token in URL. Please request a new link.
              </div>
            )}

            {/* New Password */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-[#0B1120] text-white placeholder-slate-500 border border-[#22304A] focus:border-emerald-500 rounded-xl py-3 px-4 pl-10 pr-10 text-xs outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Strength Checklist */}
            <div className="p-3.5 bg-[#0B1120]/60 border border-[#22304A] rounded-xl mb-4 space-y-1.5 text-[11px]">
              <div className={`flex items-center gap-2 ${hasLength ? "text-emerald-400 font-semibold" : "text-slate-500"}`}>
                <span>{hasLength ? "✓" : "○"}</span> At least 8 characters
              </div>
              <div className={`flex items-center gap-2 ${hasUpper ? "text-emerald-400 font-semibold" : "text-slate-500"}`}>
                <span>{hasUpper ? "✓" : "○"}</span> At least one uppercase letter (A-Z)
              </div>
              <div className={`flex items-center gap-2 ${hasLower ? "text-emerald-400 font-semibold" : "text-slate-500"}`}>
                <span>{hasLower ? "✓" : "○"}</span> At least one lowercase letter (a-z)
              </div>
              <div className={`flex items-center gap-2 ${hasDigit ? "text-emerald-400 font-semibold" : "text-slate-500"}`}>
                <span>{hasDigit ? "✓" : "○"}</span> At least one number (0-9)
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-[#0B1120] text-white placeholder-slate-500 border border-[#22304A] focus:border-emerald-500 rounded-xl py-3 px-4 pl-10 text-xs outline-none transition"
                />
              </div>
              {confirmPassword.length > 0 && !matches && (
                <p className="text-[11px] text-rose-400 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !token || !isStrong || !matches}
              className="w-full min-h-[48px] bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Reset Password & Save"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
