import { memo } from "react";
import {
  FileText,
  Download,
  Mail
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";
import {
  Card,
  Button,
  Badge,
  Modal,
  Input,
  SkeletonLoader
} from "../design-system/components";

export const ReportsDesktop = memo(function ReportsDesktop({
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
  const { colors, typography } = useTheme();

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Format Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 style={{ fontSize: typography.sizes["2xl"] || "24px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
            Report Category Generator
          </h1>
          <p style={{ fontSize: typography.sizes.sm || "14px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            Select a report category to instantly generate & download PDF, Excel, or CSV files
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8", fontWeight: typography.weights.bold }}>Format:</span>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs font-bold bg-[#1A2438] text-white"
            style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
          >
            <option value="PDF">PDF Document</option>
            <option value="Excel">Excel Spreadsheet</option>
            <option value="CSV">CSV Raw Data</option>
          </select>
        </div>
      </div>

      {/* 2. Report Category Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <SkeletonLoader key={n} height="160px" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeReports.map((rep) => {
            const IconComponent = rep.icon || FileText;
            return (
              <Card key={rep.id || rep._id} hover padding="lg" className="flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Badge variant="success">{rep.category || "General"}</Badge>
                    <span style={{ fontSize: "11px", color: colors.text.secondary || "#94A3B8" }}>
                      {rep.formats?.join(" • ") || "PDF • Excel"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="p-2.5 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(34, 197, 94, 0.12)", color: colors.accent.primary || "#22C55E" }}
                    >
                      <IconComponent size={20} />
                    </div>
                    <h3 style={{ fontSize: typography.sizes.md || "16px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
                      {rep.name}
                    </h3>
                  </div>

                  <p style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8", margin: 0 }}>
                    Generates clean breakdown, date ranges, and audit timestamps.
                  </p>
                </div>

                <div className="flex gap-2 pt-4 mt-4 border-t" style={{ borderColor: colors.border.default || "#202B45" }}>
                  <Button
                    variant="primary"
                    fullWidth
                    icon={Download}
                    onClick={() => handleGenerate(rep.id || rep._id)}
                    disabled={generating}
                  >
                    Generate {selectedFormat}
                  </Button>

                  <Button
                    variant="secondary"
                    icon={Mail}
                    onClick={() => setEmailModal(rep)}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 3. Email Modal */}
      <Modal
        isOpen={!!emailModal}
        onClose={() => setEmailModal(null)}
        title={emailModal ? `Email Report: ${emailModal.name}` : "Email Report"}
      >
        <form onSubmit={handleSendEmail} className="space-y-4">
          <Input
            label="Recipient Email Address"
            type="email"
            required
            placeholder="e.g. owner@hostel.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />

          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: colors.border.default || "#202B45" }}>
            <Button variant="secondary" fullWidth onClick={() => setEmailModal(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth disabled={generating}>
              {generating ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
});

export default ReportsDesktop;
