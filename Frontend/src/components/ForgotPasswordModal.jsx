import { useState } from "react";
import { X, Mail, Phone, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../services/api";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const input = identifier.trim();
    if (!input) {
      toast.error("Please enter your registered phone number or email");
      return;
    }

    setLoading(true);
    try {
      const isEmail = input.includes("@");
      const isPhone = /^\+?\d{10,15}$/.test(input);

      const payload = isEmail
        ? { email: input }
        : isPhone
        ? { phone: input }
        : { identifier: input };

      const res = await api.post("/api/owner/forgot-password", payload).catch(() =>
        api.post("/api/public/owner/forgot-password", payload)
      );

      if (res.data?.success !== false) {
        setSubmitted(true);
      } else {
        toast.error(res.data?.message || "Failed to process request");
      }
    } catch {
      // Return neutral confirmation even on error to prevent account enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIdentifier("");
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0B1220] border border-[#202B45] rounded-2xl shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202B45] bg-[#131C2E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reset Password</h3>
              <p className="text-xs text-slate-400">Owner Password Recovery</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h4 className="text-base font-extrabold text-white">Request Received</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-[#131C2E] p-4 rounded-xl border border-[#202B45]">
                If an account exists for <strong className="text-emerald-400">{identifier}</strong>, password reset instructions have been sent.
              </p>
              <button
                onClick={handleClose}
                className="w-full min-h-[48px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your registered phone number or email address. We will send password reset instructions if your account is active.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Phone / Email
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    {identifier.includes("@") ? <Mail size={16} /> : <Phone size={16} />}
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter phone number or email"
                    className="w-full bg-[#131C2E] border border-[#202B45] focus:border-emerald-500 text-white placeholder-slate-500 rounded-xl py-3 px-4 pl-10 text-xs outline-none transition"
                    autoFocus
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 min-h-[48px] py-3 rounded-xl border border-[#202B45] text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 min-h-[48px] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Request Reset Link"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
