import DesktopSidebar from "../components/DesktopSidebar";

export default function DashboardLayout({ children, variant = "owner", activePath }) {
  return (
    <div className="flex min-h-screen bg-[#081028]">
      <DesktopSidebar variant={variant} activePath={activePath} />
      <main className="flex-1 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}



