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
      <div className="gradient-header" style={{ paddingBottom: "70px", borderBottomLeftRadius: "40px", borderBottomRightRadius: "40px" }}>
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
          The Mobile-First<br />Hostel OS
        </h1>
        <p className="text-body" style={{ color: "rgba(255,255,255,0.8)", fontSize: "18px", marginBottom: "22px" }}>
          Manage rooms, residents, payments, and food right from your phone.
        </p>

        <button
          className="btn-primary"
          style={{ background: "white", color: "var(--primary-dark)", padding: "16px" }}
          onClick={handleEnterDashboard}
        >
          Enter Dashboard <ArrowRight size={20} />
        </button>
      </div>

      <div className="p-4 pt-6 pb-16" style={{ marginTop: "-48px" }}>
        <div className="mx-auto max-w-6xl">
          {/* Everything you need (single centered glass section) */}
          <div
            className="rounded-[28px] p-5 text-white shadow-xl"
            style={{
              background: "rgba(7, 15, 25, 0.45)",
              backdropFilter: "blur(18px)",
              border: "1px solid rgba(0,255,180,0.12)",
              boxShadow: "0 0 0 1px rgba(0,255,180,0.04), 0 14px 40px rgba(0,0,0,0.35)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* subtle teal glow */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: -1,
                background:
                  "radial-gradient(900px circle at 20% 0%, rgba(0,255,180,0.14), transparent 45%), radial-gradient(700px circle at 90% 10%, rgba(45,212,191,0.10), transparent 50%)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative" }}>
              <h2 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "14px" }}>
                Everything <span style={{
                  background: "linear-gradient(90deg, rgba(0,255,180,1) 0%, rgba(34,211,238,1) 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}>you need</span>
              </h2>
              <p style={{ color: "rgba(255,255,255,0.78)", marginBottom: "18px", lineHeight: 1.7 }}>
                Stay on top of room allocations, payments, resident requests and staff operations from one mobile-first dashboard.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <FeatureItem text="Room and bed tracking" />
                <FeatureItem text="Payment status and history" />
                <FeatureItem text="Resident onboarding & approvals" />
                <FeatureItem text="Staff and warden coordination" />
              </div>
            </div>
          </div>

          {/* Centered footer glass bar */}
          <div
            style={{
              textAlign: "center",
              marginTop: 20,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 640,
                borderRadius: 18,
                background: "rgba(7, 15, 25, 0.35)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(0,255,180,0.10)",
                padding: "12px 16px",
                color: "rgba(255,255,255,0.78)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              }}
            >
              HostelMate | © 2026 BETAMIND TechSolutions. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      {/* Hidden admin trigger: 5 rapid clicks (no visible UI) */}
      <button
        type="button"
        onClick={handleBetaMindClick}
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "auto",
          border: "none",
          padding: 0,
          margin: 0,
        }}
      />
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