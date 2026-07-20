"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function DeleteAccountButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const confirmDelete = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "La suppression a échoué.");
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      setLoading(false);
      setOpen(false);
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    }
  };

  return (
    <div className="mt-8 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-lg font-semibold text-plum">
        Zone de danger
      </h2>
      <p className="mt-1 text-xs text-slate">
        La suppression de votre compte est définitive et irréversible.
      </p>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
      >
        <Trash2 size={16} />
        Supprimer mon compte
      </button>

      {error && <p className="mt-3 text-sm text-festif">{error}</p>}

      <ConfirmDialog
        open={open}
        title="Supprimer mon compte"
        message="Cette action est irréversible. Toutes vos données seront définitivement supprimées. Confirmer ?"
        confirmLabel="Confirmer la suppression"
        loading={loading}
        onConfirm={confirmDelete}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
