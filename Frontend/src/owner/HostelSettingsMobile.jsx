import { memo } from "react";
import { Save, Building, MapPin } from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";

export const HostelSettingsMobile = memo(function HostelSettingsMobile({
  form,
  setForm,
  handleSubmit,
  loading,
  saving,
}) {
  const { colors } = useTheme();

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
            Settings
          </h1>
          <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            Hostel profile & contact details
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            background: "#22C55E",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "14px",
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            minHeight: "48px",
            boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
          }}
        >
          <Save size={18} />
          <span>{saving ? "Saving..." : "Save"}</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>
          Loading hostel settings...
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Section 1: Hostel Identity */}
          <div
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
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF", display: "flex", alignItems: "center", gap: "8px" }}>
              <Building size={18} style={{ color: "#22C55E" }} />
              <span>Hostel Identity</span>
            </div>

            <div>
              <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Hostel Name *</label>
              <input
                type="text"
                required
                value={form.hostelName}
                onChange={(e) => setForm({ ...form, hostelName: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#0B1220", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#0B1220", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>WhatsApp Helpline</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#0B1220", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
              />
            </div>
          </div>

          {/* Section 2: Address & Location */}
          <div
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
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF", display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin size={18} style={{ color: "#22C55E" }} />
              <span>Location & Address</span>
            </div>

            <div>
              <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Full Address</label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#0B1220", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>District</label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#0B1220", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>PIN Code</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#0B1220", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Amenities & Rules */}
          <div
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
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>
              Amenities & Guidelines
            </div>

            <div>
              <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Amenities (comma separated)</label>
              <input
                type="text"
                placeholder="WiFi, CCTV, Laundry, Gym"
                value={form.amenities}
                onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#0B1220", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Hostel Rules & Policies</label>
              <textarea
                rows={3}
                placeholder="1. Curfew at 10 PM&#10;2. No smoking inside"
                value={form.rules}
                onChange={(e) => setForm({ ...form, rules: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#0B1220", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
});

export default HostelSettingsMobile;
