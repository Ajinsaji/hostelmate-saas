import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, User, Lock, Eye, EyeOff } from "lucide-react";


function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        username,
        password,
      });

      if (response.data?.success && response.data?.token) {
        toast.success("Admin Login Successful!");
        localStorage.setItem("adminToken", response.data.token);
        navigate("/admin");
        return;
      }
      toast.error(response.data?.message || "Invalid Username or Password");

      toast.error(response.data?.message || "Invalid Username or Password");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Invalid Username or Password");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        className="gradient-header"
        style={{ paddingBottom: "100px", borderBottomLeftRadius: "40px", borderBottomRightRadius: "40px" }}
      >
        <button
          className="btn-icon"
          style={{ background: "rgba(255,255,255,0.2)", color: "white", marginBottom: "24px" }}
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={24} />
        </button>

        <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "8px" }}>
          Super Admin Login
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px" }}>
          Admin access (internal)
        </p>
      </div>

      <div className="p-4" style={{ marginTop: "-60px" }}>
        <div
          className="glass-card animate-slide-up"
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)", padding: "32px 24px" }}
        >
          <div className="input-group">
            <label className="input-label">Username</label>
            <div style={{ position: "relative" }}>
              <User
                size={20}
                style={{ position: "absolute", left: "16px", top: "16px", color: "var(--text-muted)" }}
              />
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
              <Lock
                size={20}
                style={{ position: "absolute", left: "16px", top: "16px", color: "var(--text-muted)" }}
              />
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

          <button className="btn-primary mb-6" onClick={handleLogin}>
            Login
          </button>

          <p className="text-center text-body" style={{ marginBottom: 0 }}>
            <span
              onClick={() => navigate("/")}
              style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}
            >
              Back to Home
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;


