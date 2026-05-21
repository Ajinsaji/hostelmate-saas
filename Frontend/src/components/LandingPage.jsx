import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

function LandingPage() {
  const navigate = useNavigate();
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef(null);
  const lastTapTimeRef = useRef(0);

  const handleBetaMindClick = () => {
    const now = Date.now();
    const elapsed = now - lastTapTimeRef.current;

    if (elapsed > 3000) {
      tapCountRef.current = 1;
    } else {
      tapCountRef.current += 1;
    }

    lastTapTimeRef.current = now;

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    tapTimeoutRef.current = setTimeout(() => {
      tapCountRef.current = 0;
      tapTimeoutRef.current = null;
      lastTapTimeRef.current = 0;
    }, 3000);

    if (tapCountRef.current === 5) {
      tapCountRef.current = 0;
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      lastTapTimeRef.current = 0;
      navigate("/admin/login");
    }
  };

  const handleEnterDashboard = () => {
    const adminToken = localStorage.getItem("adminToken");
    const ownerToken = localStorage.getItem("ownerToken");
    const user = JSON.parse(localStorage.getItem("ownerUser") || localStorage.getItem("user") || "null");

    if (adminToken) {
      navigate("/admin");
      return;
    }

    if (ownerToken) {
      const role = user?.role;
      if (role === "warden") {
        navigate("/warden");
        return;
      }
      if (role === "cook") {
        navigate("/cook");
        return;
      }
      navigate("/owner/dashboard");
      return;
    }

    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="gradient-header" style={{ paddingBottom: "120px", borderBottomLeftRadius: "40px", borderBottomRightRadius: "40px" }}>
        <div className="flex justify-between items-center mb-8">
          <h2 style={{ fontWeight: 700, fontSize: "24px" }}>HostelMate</h2>
<button 
            className="btn-secondary" 
            style={{ width: "auto", padding: "8px 16px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(23, 32, 51, 0.55)", color: "var(--text-main)" }}
            onClick={() => navigate("/login")}
          >
            Login
          </button>

        </div>
        
        <h1 style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1.1, marginBottom: "20px" }}>
          The Mobile-First<br/>Hostel OS
        </h1>
        <p className="text-body" style={{ color: "rgba(255,255,255,0.8)", fontSize: "18px", marginBottom: "32px" }}>
          Manage rooms, residents, payments, and food right from your phone.
        </p>

        <button className="btn-primary" style={{ background: "white", color: "var(--primary-dark)", padding: "18px" }} onClick={handleEnterDashboard}> 
          Enter Dashboard <ArrowRight size={20} />
        </button>
      </div>

      <div className="p-4 pt-8 pb-24" style={{ marginTop: "-60px" }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-6 text-white shadow-xl">
              <h2 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "18px" }}>Powerful hostel management with no fluff</h2>
              <p style={{ color: "rgba(255,255,255,0.78)", marginBottom: "24px", lineHeight: 1.7 }}>
                Stay on top of room allocations, payments, resident requests and staff operations from one mobile-first dashboard.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FeatureItem text="Room and bed tracking" />
                <FeatureItem text="Resident onboarding & approvals" />
                <FeatureItem text="Payment status and receipts" />
                <FeatureItem text="Staff and warden coordination" />
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 text-white shadow-xl">
              <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "16px", fontSize: "14px", letterSpacing: "0.04em" }}>Admin access</p>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p style={{ color: "rgba(255,255,255,0.82)", marginBottom: "12px", fontWeight: 600 }}>Hidden admin entry</p>
                <button
                  className="btn-secondary"
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "14px", background: "rgba(255,255,255,0.05)", color: "var(--text-main)" }}
                  onClick={handleBetaMindClick}
                >
                  BetaMIND TechSolutions
                </button>
                <p style={{ color: "rgba(255,255,255,0.55)", marginTop: "12px", fontSize: "13px" }}>
                  Subtle admin login access for secure team use.
                </p>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: "40px" }}>
            HostelMate © 2026
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <CheckCircle2 size={20} color="var(--primary)" />
      <span className="text-body" style={{ color: "var(--text-main)", fontWeight: 500 }}>{text}</span>
    </div>
  );
}

export default LandingPage;