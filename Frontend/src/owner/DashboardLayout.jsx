import DesktopSidebar from "../components/DesktopSidebar";

export default function DashboardLayout({ children, variant = "owner", activePath }) {
  return (
    <div className="min-h-screen bg-[#081028] pb-32">
      <div className="hidden lg:block">
        <DesktopSidebar variant={variant} activePath={activePath} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}

