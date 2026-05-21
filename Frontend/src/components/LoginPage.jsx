import { useState } from "react";

import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

import axios from "axios";
import toast from "react-hot-toast";

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) {
      return;
    }

    if (!username?.trim()) {
      toast.error("Enter email, phone or username");
      return;
    }
    if (!password) {
      toast.error("Enter password");
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
        localStorage.setItem("token", response.data.token);
        const userData = response.data.owner || response.data.user || {};
        localStorage.setItem("user", JSON.stringify(userData));

        const role = userData.role || "owner";
        const needsOnboarding = response.data.needsOnboarding === true;

        if (role === "warden") {
          navigate("/warden");
        } else if (role === "cook") {
          navigate("/cook");
        } else if (role === "owner" && needsOnboarding) {
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }
      } else {
        const serverMessage = response.data?.message || "";
        if (/owner not found|account not found|provide email|provide phone|provide username/i.test(serverMessage)) {
          toast.error("Account not found");
        } else if (/invalid credentials|password/i.test(serverMessage)) {
          toast.error("Invalid password");
        } else {
          toast.error("Unable to login");
        }
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.details || "Unable to login";
      if (/owner not found|account not found/i.test(message)) {
        toast.error("Account not found");
      } else if (/invalid credentials|password/i.test(message)) {
        toast.error("Invalid password");
      } else {
        toast.error("Unable to login");
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

