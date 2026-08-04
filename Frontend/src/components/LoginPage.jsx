import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { api } from "../services/api";
import { setOwnerAuth, setStoredOwner } from "../utils/authToken";

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [trackPhone, setTrackPhone] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState("");

  const handleLogin = async () => {
    if (loading) {
      return;
    }

    if (!username?.trim()) {
      toast.error("⚠️ Enter your phone number");
      return;
    }
    if (!password) {
      toast.error("⚠️ Enter your password");
      return;
    }

    const trimmed = username.trim();
    const isEmail = trimmed.includes("@");
    const isPhone = /^\+?\d{10,15}$/.test(trimmed);

    const payload = isEmail
      ? { email: trimmed, password }
      : isPhone
      ? { phone: trimmed, password }
      : { username: trimmed, password };

    setLoading(true);
    try {
      const response = await api.post("/api/owner/login", payload);

      if (response.data.success) {
        toast.success("Login successful");
        console.log("[LoginPage] LOGIN RESPONSE:", response.data);

        const userData = response.data.owner || response.data.user || {};
        const role = userData.role || "owner";
        const storedUser = {
          ...userData,
          role,
          onboardingCompleted: userData.onboardingCompleted === true,
          firstLogin: userData.firstLogin === true,
          token: response.data.token,
        };

        console.log("Stored User:", storedUser);
        console.log("Stored onboardingStep:", storedUser.onboardingStep);

        setOwnerAuth(response.data.token);
        setStoredOwner(storedUser);

        console.log("[LoginPage] TOKEN SAVED (ownerToken):", localStorage.getItem("ownerToken"));
        console.log("[LoginPage] OWNER SAVED (ownerUser):", localStorage.getItem("ownerUser"));

        // Debug onboarding routing
        const needsOnboarding =
          userData.firstLogin === true ||
          userData.onboardingCompleted !== true;

        console.log("[LoginPage] needsOnboarding:", needsOnboarding);
        console.log("[LoginPage] onboardingCompleted:", userData.onboardingCompleted);
        console.log("[LoginPage] mustChangePassword:", userData.mustChangePassword);

        const targetRoute = (() => {
          const normRole = (role || "").toLowerCase();
          if (normRole === "warden") return "/warden/dashboard";
          if (normRole === "cook") return "/cook/dashboard";
          if (normRole === "accountant") return "/accountant/dashboard";
          if (normRole === "owner") return needsOnboarding ? "/ownerAction" : "/owner/dashboard";
          return "/owner/dashboard";
        })();

        console.log("[LoginPage] Navigating to:", targetRoute);
        navigate(targetRoute, { replace: true });
      } else {
        const serverMessage = response.data?.message || "";
        if (/owner not found|account not found|provide email|provide phone|provide username/i.test(serverMessage)) {
          toast.error("❌ Account Not Found\nNo account exists with this phone number/email.");
        } else if (/invalid credentials|invalid password|incorrect password|password match false|password/i.test(serverMessage)) {
          toast.error("❌ Incorrect Password\nThe password you entered is incorrect.");
        } else if (/pending|activation pending|approved but not yet activated|not yet activated/i.test(serverMessage)) {
          toast("🟡 Hostel Activation Pending", { icon: "🟡" });
          toast.error("🟡 Hostel Activation Pending\nYour hostel has been approved but not yet activated by the administrator.");
        } else {
          toast.error("❌ Server Error\nSomething went wrong. Please try again later.");
        }
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.details || "Unable to login";
      if (/owner not found|account not found|user not found/i.test(message)) {
        toast.error("❌ Account Not Found\nNo account exists with this phone number/email.");
      } else if (/invalid credentials|invalid password|incorrect password|password match false|password/i.test(message)) {
        toast.error("❌ Incorrect Password\nThe password you entered is incorrect.");
      } else if (/pending|activation pending|approved but not yet activated|not yet activated/i.test(message)) {
        toast.error("🟡 Hostel Activation Pending\nYour hostel has been approved but not yet activated by the administrator.");
      } else if (/disabled|suspended/i.test(message)) {
        toast.error("❌ Account Disabled\nPlease contact support.");
      } else {
        toast.error("❌ Server Error\nSomething went wrong. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#16A34A] opacity-[0.05] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#6C4CF5] opacity-[0.05] rounded-full blur-[120px] pointer-events-none" />

      {/* Header back link */}
      <button 
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center gap-2 text-[#CBD5E1] hover:text-white transition-colors duration-200 bg-[#162032] border border-[#22304A] py-2.5 px-4 rounded-xl shadow-md z-20"
      >
        <ArrowLeft size={16} />
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      {/* Login Card Container */}
      <div className="w-full max-w-md bg-[#162032]/95 border border-[#22304A] rounded-2xl shadow-2xl p-8 backdrop-blur-md relative z-10 my-8">
        
        {/* Headings */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Welcome Back</h1>
          <p className="text-[#CBD5E1] text-sm mt-2">Login to HostelMate Enterprise OS</p>
        </div>

        {/* Username/Phone/Email Field */}
        <div className="mb-5">
          <label className="block text-white text-sm font-medium mb-2">
            Username / Phone / Email
          </label>
          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Enter phone or email"
              className="w-full bg-[#0B1120] text-white placeholder-[#94A3B8] border border-[#22304A] focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/25 focus:shadow-[0_0_15px_rgba(22,163,74,0.25)] rounded-xl py-3.5 px-4 pl-12 transition-all duration-300 outline-none text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="mb-8">
          <label className="block text-white text-sm font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type={passwordVisible ? "text" : "password"}
              placeholder="Enter password"
              className="w-full bg-[#0B1120] text-white placeholder-[#94A3B8] border border-[#22304A] focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/25 focus:shadow-[0_0_15px_rgba(22,163,74,0.25)] rounded-xl py-3.5 px-4 pl-12 pr-12 transition-all duration-300 outline-none text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              onClick={() => setPasswordVisible((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition-colors duration-200"
            >
              {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Primary Action Button */}
        <button 
          className="w-full bg-gradient-to-r from-[#16A34A] to-[#15803D] hover:from-[#15803D] hover:to-[#16A34A] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-[#16A34A]/10 hover:shadow-[#16A34A]/30 transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none mb-4"
          onClick={handleLogin} 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>Login to Dashboard</span>
          )}
        </button>

        {/* Track Application Button */}
        <button
          type="button"
          onClick={() => {
            try {
              window.dispatchEvent(new CustomEvent("HOSTELMATE_TRACK_APPLICATION_STATUS_OPEN"));
            } catch {
              // ignore
            }
            setTrackModalOpen(true);
          }}
          className="w-full bg-[#1C2740] hover:bg-[#22304A] border border-[#22304A] text-[#CBD5E1] hover:text-white py-3.5 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99] mb-6 shadow-sm"
        >
          Track Application Status
        </button>

        {/* Register Redirect */}
        <p className="text-center text-sm text-[#CBD5E1]">
          Don't have an account?{" "}
          <span 
            onClick={() => navigate("/register")} 
            className="text-[#16A34A] hover:underline font-semibold cursor-pointer transition-colors duration-200"
          >
            Register now
          </span>
        </p>

      </div>

      {/* Track Status Modal */}
      {trackModalOpen ? (
        <div className="fixed inset-0 bg-[#0B1120]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-[#162032] border border-[#22304A] rounded-2xl p-6 relative shadow-2xl animate-scale-up">
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Track Application Status</h2>
              <button
                type="button"
                onClick={() => {
                  setTrackModalOpen(false);
                  setTrackError("");
                }}
                className="text-[#94A3B8] hover:text-white transition-colors duration-200 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-[#CBD5E1] text-xs font-semibold mb-2 uppercase tracking-wide">
                Enter registered phone number
              </label>
              <input
                type="text"
                value={trackPhone}
                onChange={(e) => setTrackPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full bg-[#0B1120] text-white placeholder-[#94A3B8] border border-[#22304A] focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/25 focus:shadow-[0_0_15px_rgba(22,163,74,0.25)] rounded-xl py-3 px-4 outline-none text-sm"
              />
            </div>

            {trackError ? (
              <div className="text-[#ef4444] text-xs font-semibold mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                {trackError}
              </div>
            ) : null}

            <button
              type="button"
              disabled={trackLoading}
              onClick={async () => {
                const phone = trackPhone?.trim();
                if (!phone) {
                  setTrackError("Please enter phone number");
                  return;
                }

                setTrackLoading(true);
                setTrackError("");
                try {
                  const res = await api.get(`/api/hostel-request/status/${encodeURIComponent(phone)}`);
                  const found = res?.data?.success;
                  const requestId = res?.data?.requestId;

                  if (found === false || !requestId) {
                    setTrackError("No application found for this phone number.");
                    return;
                  }

                  localStorage.setItem("hostelRequestPhone", phone);
                  localStorage.setItem("hostelRequestId", requestId);

                  setTrackModalOpen(false);
                  navigate("/request-status");
                } catch {
                  setTrackError("No application found for this phone number.");
                } finally {
                  setTrackLoading(false);
                }
              }}
              className="w-full bg-gradient-to-r from-[#16A34A] to-[#15803D] hover:from-[#15803D] hover:to-[#16A34A] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-[#16A34A]/10 hover:shadow-[#16A34A]/30 transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {trackLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Checking Status...</span>
                </>
              ) : (
                <span>Check Status</span>
              )}
            </button>
          </div>
        </div>
      ) : null}

    </div>
  );
}

export default LoginPage;
