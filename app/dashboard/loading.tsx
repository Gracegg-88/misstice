import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 size={28} className="animate-spin text-violet" />
    </div>
  );
}
