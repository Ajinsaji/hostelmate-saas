import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

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

        <button className="btn-primary" style={{ background: "white", color: "var(--primary-dark)", padding: "18px" }} onClick={() => navigate("/dashboard")}>
          Enter Dashboard <ArrowRight size={20} />
        </button>
      </div>

      <div className="p-4 pt-8 pb-24" style={{ marginTop: "-60px" }}>
        <div className="glass-card mb-6" style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)" }}>
          <h3 className="text-h2 mb-4">Everything you need</h3>

          <FeatureItem text="Visual Room & Bed Allocation" />
          <FeatureItem text="QR-based Resident Onboarding" />
          <FeatureItem text="Partial Payment Tracking" />
          <FeatureItem text="Automated WhatsApp Reminders" />
          <FeatureItem text="Food & LPG Analytics" />
        </div>

        <div style={{ marginTop: 24, textAlign: "center", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
          HostelMate © 2026 <span
            onClick={() => navigate("/admin/login")}
            style={{ color: "rgba(167,243,208,1)", fontWeight: 700, cursor: "pointer" }}
          >
            BetaMind
          </span>
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