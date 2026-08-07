import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";

export default function GuideCta({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Reveal variant="scale" className="inline-block">
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet/25 transition-all hover:bg-violet-dark"
      >
        {label}
        <ArrowRight size={16} />
      </Link>
    </Reveal>
  );
}
