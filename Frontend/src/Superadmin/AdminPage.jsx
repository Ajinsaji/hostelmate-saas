import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import SuperadminBottomNav from "../components/SuperadminBottomNav";

function AdminPage() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #072f1f 0%, #0b7a45 100%)",
        color: "white",
        padding: "20px",
        fontFamily: "Poppins",
        paddingBottom: "110px",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: 18, textAlign: "center" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              margin: "0 auto",
              background:
                "radial-gradient(circle at top left, rgba(255,255,255,0.25), rgba(255,255,255,0.05))",
              border: "1px solid rgba(255,255,255,0.25)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: 1,
            }}
          >
            HM
          </div>
          <h1 style={{ color: "#ffffff", marginTop: 12, marginBottom: 4 }}>
            Super Admin Profile
          </h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Manage your credentials, contact details, and security settings.
          </p>
        </div>

        <div
          style={{
            background: "rgba(7, 46, 31, 0.75)",
            borderRadius: 26,
            padding: 22,
            boxShadow: "0 10px 35px rgba(0,0,0,0.15)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 20,
                padding: 16,
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <h3 style={{ margin: 0, color: "#a7f3d0" }}>Admin Contact</h3>
              <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                <p style={{ margin: 0, opacity: 0.95 }}>
                  <b>Email:</b> support@hostelmate.local
                </p>
                <p style={{ margin: 0, opacity: 0.95 }}>
                  <b>Phone:</b> +91 90000 00000
                </p>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 20,
                padding: 16,
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <h3 style={{ margin: 0, color: "#a7f3d0" }}>Reset Admin Password</h3>
              <p style={{ margin: "8px 0 0", opacity: 0.9, fontSize: 13 }}>
                This is a UI placeholder. Wire it to your backend password-reset
                endpoint.
              </p>

              <button
                type="button"
                onClick={() => { /* placeholder */ }}

                style={{
                  marginTop: 12,
                  width: "100%",
                  background:
                    "linear-gradient(90deg, rgba(11,122,69,1) 0%, rgba(34,197,94,1) 100%)",
                  color: "white",
                  border: "none",
                  padding: "12px 16px",
                  borderRadius: 16,
                  cursor: "pointer",
                  fontWeight: 700,
                  boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
                }}
              >
                Reset Password
              </button>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 20,
                padding: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                marginTop: "14px"
              }}
            >
              <h3 style={{ margin: 0, color: "#fca5a5" }}>Account Actions</h3>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("adminToken");
                  localStorage.removeItem("ownerToken");
                  localStorage.removeItem("residentToken");
                  navigate("/login");
                }}
                style={{
                  marginTop: 12,
                  width: "100%",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  padding: "12px 16px",
                  borderRadius: 16,
                  cursor: "pointer",
                  fontWeight: 700,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </div>

        <div style={{ height: 18 }} />
      </div>
      <SuperadminBottomNav />
    </div>
  );
}

export default AdminPage;
