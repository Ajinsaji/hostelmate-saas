export default function DashboardLayout({ children }) {
  return (
    <main className="flex-1 pb-32">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}

