import DesktopSidebar from "../components/DesktopSidebar";
import PageHeader from "../components/PageHeader";

export default function DesktopShell({
  variant = "owner",
  title,
  breadcrumbs,
  backTo,
  children,
}) {
  return (
    <div className="flex min-h-screen bg-[#081028]">
      <DesktopSidebar variant={variant} />
      <div className="flex-1">
        <div className="hidden lg:block">
          <PageHeader title={title} breadcrumbs={breadcrumbs} backTo={backTo} />
        </div>

        <div className="lg:px-8 lg:pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}

