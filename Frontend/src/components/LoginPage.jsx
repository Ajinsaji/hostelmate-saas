import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Lock } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      // Owner login endpoint (JWT payload includes: ownerId, hostelId, role:"owner")
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/owner/login`, {
        // backend supports phone or email + password; your UI uses username
        ...(username.includes("@")
          ? { email: username }
          : { phone: username }),
        password,
      });

      if (response.data.success) {
        toast.success("Login Successful!");
        localStorage.setItem("token", response.data.token);
        navigate("/dashboard");
      }
    } catch (error) {
      const msg = error?.response?.data?.message || "Invalid Username or Password";
      toast.error(msg);
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
                type="password"
                placeholder="Enter password"
                className="input-field"
                style={{ paddingLeft: "48px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button className="btn-primary mb-6" onClick={handleLogin}>
            Login to Dashboard
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