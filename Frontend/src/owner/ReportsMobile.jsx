import { memo } from "react";
import {
  FileText,
  Download,
  Mail,
  X
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";

export const ReportsMobile = memo(function ReportsMobile({
  activeReports,
  loading,
  selectedFormat,
  setSelectedFormat,
  handleGenerate,
  emailModal,
  setEmailModal,
  emailInput,
  setEmailInput,
  handleSendEmail,
  generating,
}) {
  const { colors } = useTheme();

  const formats = ["PDF", "Excel", "CSV"];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "24px",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      {/* 1. Header & Title */}
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
          Reports
        </h1>
        <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
          Generate and download operational reports
        </p>
      </div>

      {/* 2. Format Selector Chips */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#94A3B8" }}>Export Format:</span>
        {formats.map((fmt) => {
          const isSel = selectedFormat === fmt;
          return (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              style={{
                background: isSel ? "#22C55E" : colors.background.card || "#131C2E",
                color: isSel ? "#FFFFFF" : colors.text.secondary || "#94A3B8",
                border: `1px solid ${isSel ? "#22C55E" : colors.border.default || "#202B45"}`,
                borderRadius: "9999px",
                padding: "6px 14px",
                fontSize: "13px",
                fontWeight: isSel ? 700 : 500,
                cursor: "pointer",
                minHeight: "48px",
              }}
            >
              {fmt}
            </button>
          );
        })}
      </div>

      {/* 3. Stacked Mobile Report Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>
            Loading report categories...
          </div>
        ) : (
          activeReports.map((rep) => {
            const IconComp = rep.icon || FileText;
            const title = rep.name || rep.title || "Report";
            const category = rep.category || "General";

            return (
              <div
                key={rep.id || rep._id}
                style={{
                  background: colors.background.card || "#131C2E",
                  border: `1px solid ${colors.border.default || "#202B45"}`,
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(34, 197, 94, 0.12)", color: "#22C55E" }}>
                    <IconComp size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>{title}</div>
                    <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>
                      Category: {category}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    onClick={() => handleGenerate(rep.id || rep._id)}
                    disabled={generating}
                    style={{
                      background: "#22C55E",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "12px",
                      padding: "10px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      minHeight: "44px",
                    }}
                  >
                    <Download size={18} />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => setEmailModal(rep)}
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      color: "#FFFFFF",
                      border: `1px solid ${colors.border.default || "#202B45"}`,
                      borderRadius: "12px",
                      padding: "10px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      minHeight: "44px",
                    }}
                  >
                    <Mail size={18} style={{ color: "#94A3B8" }} />
                    <span>Email</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* EMAIL REPORT MODAL */}
      {emailModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              background: colors.background.primary || "#0B1220",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              padding: "24px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
                Email Report
              </h3>
              <button
                onClick={() => setEmailModal(null)}
                style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Recipient Email</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@company.com"
                style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
              />
            </div>

            <button
              onClick={handleSendEmail}
              disabled={generating}
              style={{
                background: "#22C55E",
                color: "#FFF",
                border: "none",
                borderRadius: "12px",
                padding: "12px",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                minHeight: "44px",
              }}
            >
              {generating ? "Sending..." : "Send Email Report"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default ReportsMobile;
