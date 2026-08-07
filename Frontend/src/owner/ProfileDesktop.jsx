import { memo } from "react";
import {
  User,
  Building,
  Lock,
  LogOut,
  Bell,
  CreditCard,
  HardDrive,
  HelpCircle,
  Info,
  ChevronRight,
  QrCode,
  Copy
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";
import {
  DashboardCard,
  Button,
  Avatar,
  Modal,
  SectionHeader
} from "../design-system/components";

export const ProfileDesktop = memo(function ProfileDesktop({
  ownerData,
  hostelData,
  showQRModal,
  setShowQRModal,
  pushEnabled,
  setPushEnabled,
  handleLogout,
  handleCopy,
  navigate,
  buildQrUrl,
}) {
  const { colors, typography } = useTheme();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {/* 1. Header & Profile Banner */}
      <div className="flex items-center gap-4">
        <Avatar name={ownerData.ownerName} size="xl" />
        <div>
          <h1 style={{ fontSize: typography.sizes["2xl"] || "24px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
            {ownerData.ownerName}
          </h1>
          <p style={{ fontSize: typography.sizes.sm || "14px", color: colors.text.secondary || "#94A3B8", margin: "2px 0 0" }}>
            {ownerData.phone} • {ownerData.email}
          </p>
        </div>
      </div>

      {/* 2. Apple Settings Group 1: Account & Profile */}
      <div>
        <SectionHeader title="Account Settings" />
        <DashboardCard padding="none" className="divide-y divide-[#202B45] overflow-hidden">
          <SettingsRow
            icon={User}
            title="Edit Owner Profile"
            subtitle="Update personal info and contact details"
            onClick={() => navigate("/owner/profile-edit")}
          />
          <SettingsRow
            icon={QrCode}
            title="Public Admission QR Code"
            subtitle="Share admission link or download printable QR"
            onClick={() => setShowQRModal(true)}
          />
        </DashboardCard>
      </div>

      {/* 3. Apple Settings Group 2: Workspace & Hostel */}
      <div>
        <SectionHeader title="Workspace & Hostel" />
        <DashboardCard padding="none" className="divide-y divide-[#202B45] overflow-hidden">
          <SettingsRow
            icon={Building}
            title="Hostel Configurations"
            subtitle={hostelData?.hostelName || "Manage hostel address, rooms, and rules"}
            onClick={() => navigate("/owner/hostel-settings")}
          />
          <SettingsRow
            icon={CreditCard}
            title="Billing & Subscription"
            subtitle="View plan status and payment invoices"
            onClick={() => navigate("/owner/billing")}
          />
          <SettingsRow
            icon={HardDrive}
            title="Storage & Quota"
            subtitle="Google Drive cloud storage allocation"
            onClick={() => navigate("/owner/storage-center")}
          />
        </DashboardCard>
      </div>

      {/* 4. Apple Settings Group 3: Preferences & Security */}
      <div>
        <SectionHeader title="Security & Preferences" />
        <DashboardCard padding="none" className="divide-y divide-[#202B45] overflow-hidden">
          <SettingsRow
            icon={Lock}
            title="Security & Password"
            subtitle="Change account password and 2FA settings"
            onClick={() => navigate("/owner/update-password")}
          />
          <div className="flex items-center justify-between p-4" style={{ background: colors.background.card }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Bell size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
                  Push Notifications
                </h4>
                <p style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8", margin: "2px 0 0" }}>
                  Alerts for new admissions and rent payments
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={() => setPushEnabled(!pushEnabled)}
              className="w-5 h-5 accent-emerald-500 cursor-pointer"
            />
          </div>
        </DashboardCard>
      </div>

      {/* 5. Apple Settings Group 4: Support & About */}
      <div>
        <SectionHeader title="Support & Application" />
        <DashboardCard padding="none" className="divide-y divide-[#202B45] overflow-hidden">
          <SettingsRow
            icon={HelpCircle}
            title="Help Desk & Support"
            subtitle="Contact HostelMate customer support team"
            onClick={() => navigate("/owner/support")}
          />
          <SettingsRow
            icon={Info}
            title="About HostelMate Enterprise"
            subtitle="Version 4.0 Pro • Enterprise Build"
            onClick={() => {}}
          />
        </DashboardCard>
      </div>

      {/* 6. Logout Action */}
      <div className="pt-2">
        <Button variant="danger" fullWidth icon={LogOut} onClick={handleLogout}>
          Log Out of HostelMate
        </Button>
      </div>

      {/* QR Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Hostel Admission QR Code"
      >
        {hostelData && (
          <div className="text-center space-y-4">
            <p style={{ fontSize: "14px", color: colors.text.secondary || "#94A3B8" }}>
              {hostelData.hostelName || hostelData.name}
            </p>

            {hostelData.qrCodeUrl && (
              <img 
                src={buildQrUrl(hostelData.qrCodeUrl)} 
                alt="QR Code" 
                className="w-48 h-48 mx-auto rounded-xl border border-white/10" 
              />
            )}

            <div className="p-3 rounded-xl bg-white/5 text-xs text-slate-300 break-all font-mono">
              {hostelData.publicUrl || `${window.location.origin}/public/hostel/${hostelData.uniqueCode || hostelData._id}`}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                fullWidth 
                icon={Copy} 
                onClick={() => handleCopy(hostelData.publicUrl || `${window.location.origin}/public/hostel/${hostelData.uniqueCode}`)}
              >
                Copy Link
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
});

function SettingsRow({ icon: Icon, title, subtitle, onClick }) {
  const { colors, typography } = useTheme();

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
      style={{ background: colors.background.card || "#131C2E" }}
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
          <Icon size={18} />
        </div>
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
            {title}
          </h4>
          {subtitle && (
            <p style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8", margin: "2px 0 0" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <ChevronRight size={18} style={{ color: colors.text.secondary || "#94A3B8" }} />
    </div>
  );
}

export default ProfileDesktop;
