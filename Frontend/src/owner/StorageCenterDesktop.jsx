import { memo } from "react";
import {
  HardDrive,
  FileText,
  Sparkles
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";
import {
  Card,
  DashboardCard,
  Button,
  Badge,
  ProgressBar,
  MobileCard,
  SectionHeader
} from "../design-system/components";

export const StorageCenterDesktop = memo(function StorageCenterDesktop({
  usedMB,
  limitMB,
  usagePercent,
  defaultFolders,
  defaultFiles,
  storageData,
  handleCleanup,
  handleDelete,
  processing,
}) {
  const { colors, typography } = useTheme();

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Clean Up Trigger */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 style={{ fontSize: typography.sizes["2xl"] || "24px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
            Google Drive Asset & Storage Center
          </h1>
          <p style={{ fontSize: typography.sizes.sm || "14px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            Workspace document archives, ID verifications, and Cloud storage optimizer
          </p>
        </div>

        <Button variant="primary" icon={Sparkles} onClick={handleCleanup} disabled={processing}>
          {processing ? "Cleaning..." : "Clean Up Storage"}
        </Button>
      </div>

      {/* 2. Storage Quota Progress Card */}
      <DashboardCard>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <HardDrive size={20} style={{ color: colors.accent.primary || "#22C55E" }} />
            <h3 style={{ fontSize: typography.sizes.md || "16px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
              Cloud Storage Meter
            </h3>
          </div>
          <Badge variant="success">Pro Quota</Badge>
        </div>

        <ProgressBar
          value={usedMB}
          max={limitMB}
          showLabel
          label={`${usedMB} MB / ${limitMB} MB Used`}
          color={usagePercent > 80 ? "danger" : "primary"}
          height="10px"
        />

        <div className="flex justify-between text-xs pt-3 mt-3 border-t" style={{ borderColor: colors.border.default || "#202B45", color: colors.text.secondary || "#94A3B8" }}>
          <span>Available Space: <b>{Math.round(limitMB - usedMB)} MB</b></span>
          <span style={{ color: colors.accent.primary || "#22C55E", fontWeight: typography.weights.bold }}>Smart Cache Cleaned</span>
        </div>
      </DashboardCard>

      {/* 3. Folder Directory Grid */}
      <div>
        <SectionHeader title="Storage Folders" subtitle="Google Drive style category archives" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {defaultFolders.map((folder, idx) => {
            const IconComp = folder.icon;
            return (
              <Card key={idx} hover padding="md">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2.5 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(34, 197, 94, 0.12)", color: colors.accent.primary || "#22C55E" }}
                  >
                    <IconComp size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
                      {folder.name}
                    </h4>
                    <span style={{ fontSize: "11px", color: colors.text.secondary || "#94A3B8" }}>
                      {folder.count} files ({folder.sizeMB} MB)
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 4. Files Directory List */}
      <div>
        <SectionHeader title="Recent Documents & Assets" />
        <div className="space-y-3">
          {(storageData?.files || defaultFiles).map((file) => (
            <MobileCard
              key={file.id}
              avatar={<FileText size={20} style={{ color: colors.text.secondary || "#94A3B8" }} />}
              title={file.name}
              subtitle={`${file.category} • ${file.sizeMB} MB • Uploaded ${file.uploadedAt}`}
              onMenuClick={() => handleDelete(file.id)}
            />
          ))}
        </div>
      </div>

    </div>
  );
});

export default StorageCenterDesktop;
