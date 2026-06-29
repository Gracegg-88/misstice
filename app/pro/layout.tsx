import ProTopbar from "@/components/pro/ProTopbar";
import ProSidebar from "@/components/pro/ProSidebar";

export default function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <ProTopbar />
      <div className="flex">
        <ProSidebar />
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
