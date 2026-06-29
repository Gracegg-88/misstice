import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <DashboardTopbar />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
