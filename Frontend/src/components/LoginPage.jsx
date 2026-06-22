import { useState } from "react";

import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

import axios from "axios";
import toast from "react-hot-toast";
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
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/owner/login`,
        payload
      );

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
        if (role === "warden") return "/warden";
        if (role === "cook") return "/cook";
        if (role === "owner") return needsOnboarding ? "/ownerAction" : "/owner/dashboard";
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
          toast("🟡 Hostel Activation Pending", {
            icon: "🟡",
          });
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header Area */}
      <div className="gradient-header" style={{ paddingBottom: "100px", borderBottomLeftRadius: "40px", borderBottomRightRadius: "40px" }}>
        <button 
          className="btn-icon" 
          style={{ background: "rgba(255,255,255,0.2)", color: "white", marginBottom: "24px" }}
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "8px" }}>Welcome Back</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px" }}>Login to HostelMate OS</p>
      </div>

      {/* Form Area */}
      <div className="p-4" style={{ marginTop: "-60px" }}>
        <div className="glass-card animate-slide-up" style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)", padding: "32px 24px" }}>
          
          <div className="input-group">
            <label className="input-label">Username</label>
            <div style={{ position: "relative" }}>
              <User size={20} style={{ position: "absolute", left: "16px", top: "16px", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Enter username"
                className="input-field"
                style={{ paddingLeft: "48px" }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group mb-6">
            <label className="input-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={20} style={{ position: "absolute", left: "16px", top: "16px", color: "var(--text-muted)" }} />
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Enter password"
                className="input-field"
                style={{ paddingLeft: "48px", paddingRight: "48px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                onClick={() => setPasswordVisible((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button className="btn-primary mb-6" onClick={handleLogin} disabled={loading}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing In...</> : "Login to Dashboard"}
          </button>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
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
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#fff",
                padding: "12px 16px",
                borderRadius: "12px",
                fontWeight: 700,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Track Application Status
            </button>
          </div>

          {trackModalOpen ? (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 4000,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 420,
                  background: "#081028",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 16,
                  padding: 20,
                  color: "#fff",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>Track Application Status</div>
                  <button
                    type="button"
                    onClick={() => setTrackModalOpen(false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "rgba(255,255,255,0.8)",
                      cursor: "pointer",
                      fontSize: 16,
                      fontWeight: 900,
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginBottom: 10, color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>
                  Enter phone number
                </div>

                <input
                  type="text"
                  value={trackPhone}
                  onChange={(e) => setTrackPhone(e.target.value)}
                  placeholder="Phone number"
                  className="input-field"
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    color: "#fff",
                    outline: "none",
                    marginBottom: 10,
                  }}
                />

                {trackError ? (
                  <div style={{ color: "#ef4444", fontWeight: 900, marginBottom: 10 }}>
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
                      const res = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/hostel-request/status/${encodeURIComponent(phone)}`
                      );

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
                    } catch (e) {
                      setTrackError("No application found for this phone number.");
                    } finally {
                      setTrackLoading(false);
                    }
                  }}
                  className="btn-primary w-full"
                  style={{ width: "100%" }}
                >
                  {trackLoading ? <Loader2 size={16} className="animate-spin" /> : "Check Status"}
                </button>
              </div>
            </div>
          ) : null}

          <p className="text-center text-body">
            Don't have an account?{" "}
            <span 
              onClick={() => navigate("/register")} 
              style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}
            >
              Register now
            </span>
          </p>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;

