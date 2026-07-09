import { Eye } from "lucide-react";

// Bandeau affiché à un collaborateur sans droit d'édition sur la section.
export default function ReadOnlyBanner({
  section = "cette section",
}: {
  section?: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-violet/20 bg-violet-soft/60 px-4 py-3 text-sm text-plum">
      <Eye size={18} className="shrink-0 text-violet" />
      <span>
        Vous consultez {section} en <strong>lecture seule</strong>.
        L&apos;organisateur ne vous a pas donné les droits de modification.
      </span>
    </div>
  );
}
