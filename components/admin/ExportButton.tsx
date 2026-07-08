"use client";

import { Download } from "lucide-react";

type Stats = {
  users: number;
  families: number;
  vendors: number;
  events: number;
  pendingVerification: number;
};

export default function ExportButton({ stats }: { stats: Stats }) {
  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["Métrique", "Valeur"],
      ["Utilisateurs", stats.users],
      ["Familles", stats.families],
      ["Prestataires", stats.vendors],
      ["Événements", stats.events],
      ["Prestataires à vérifier", stats.pendingVerification],
      ["Généré le", new Date().toLocaleString("fr-FR")],
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `misstice-rapport-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={exportCsv}
      className="inline-flex items-center gap-2 self-start rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-plum transition-colors hover:bg-cream"
    >
      <Download size={16} />
      Exporter le rapport
    </button>
  );
}
