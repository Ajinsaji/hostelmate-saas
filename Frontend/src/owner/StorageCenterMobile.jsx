import { memo } from "react";
import {
  HardDrive,
  Trash2,
  Sparkles
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";

export const StorageCenterMobile = memo(function StorageCenterMobile({
  usedMB,
  limitMB,
  defaultFolders,
  defaultFiles,
  handleCleanup,
  handleDelete,
  processing,
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
            Storage
          </h1>
          <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            {usedMB} MB used of {limitMB} MB
          </p>
        </div>

        <button
          onClick={handleCleanup}
          disabled={processing}
          style={{
            background: "#22C55E",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "14px",
            padding: "10px 14px",
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
          <Sparkles size={18} />
          <span>{processing ? "Cleaning..." : "Clean"}</span>
        </button>
      </div>

      {/* 2. Storage Progress Meter Card */}
      <div
        style={{
          background: colors.background.card || "#131C2E",
          border: `1px solid ${colors.border.default || "#202B45"}`,
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HardDrive size={20} style={{ color: "#22C55E" }} />
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>Cloud Meter</span>
          </div>
          <span style={{ fontSize: "12px", color: "#22C55E", fontWeight: 700 }}>Pro Quota</span>
        </div>

        <div style={{ width: "100%", height: "8px", borderRadius: "9999px", background: "rgba(255, 255, 255, 0.1)", overflow: "hidden" }}>
          <div style={{ width: `${(usedMB / limitMB) * 100}%`, height: "100%", background: "#22C55E" }} />
        </div>

        <div style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8" }}>
          Available Space: <strong style={{ color: "#FFF" }}>{Math.round(limitMB - usedMB)} MB</strong>
        </div>
      </div>

      {/* 3. Folder Category Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {defaultFolders.map((f, i) => {
          const IconComponent = f.icon;
          return (
            <div
              key={i}
              style={{
                background: colors.background.card || "#131C2E",
                border: `1px solid ${colors.border.default || "#202B45"}`,
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(34, 197, 94, 0.12)", color: "#22C55E", width: "fit-content" }}>
                <IconComponent size={20} />
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>{f.name}</div>
              <div style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8" }}>
                {f.count} files • {f.sizeMB} MB
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Vertically Stacked File List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
          Recent Documents
        </h2>

        {defaultFiles.map((file) => (
          <div
            key={file.id}
            style={{
              background: colors.background.card || "#131C2E",
              border: `1px solid ${colors.border.default || "#202B45"}`,
              borderRadius: "16px",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ minWidth: 0, flex: 1, paddingRight: "12px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {file.name}
              </div>
              <div style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8", marginTop: "2px" }}>
                {file.sizeMB} MB • {file.uploadedAt}
              </div>
            </div>

            <button
              onClick={() => handleDelete(file.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "#EF4444",
                cursor: "pointer",
                padding: "8px",
                minHeight: "44px",
                minWidth: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Delete file"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

export default StorageCenterMobile;
