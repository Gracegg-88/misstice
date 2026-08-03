"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ConfirmDialog";

type Review = {
  id: string;
  rating: number;
  eventType: string | null;
  body: string | null;
  authorName: string | null;
  createdAt: string;
  vendorName: string;
};

export default function AvisClient({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmReview, setConfirmReview] = useState<Review | null>(null);
  const [error, setError] = useState("");

  const doRemove = async () => {
    if (!confirmReview) return;
    setBusy(confirmReview.id);
    setError("");
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("reviews")
      .delete()
      .eq("id", confirmReview.id);
    setBusy(null);
    setConfirmReview(null);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Avis
      </h1>
      <p className="mt-1 text-sm text-slate">
        {reviews.length} avis déposé{reviews.length > 1 ? "s" : ""}.
      </p>
      {error && (
        <p className="mt-3 rounded-xl bg-festif-soft px-4 py-2 text-sm font-medium text-festif">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-slate">
                <th className="px-5 py-3 font-medium">Prestataire</th>
                <th className="px-5 py-3 font-medium">Auteur</th>
                <th className="px-5 py-3 font-medium">Note</th>
                <th className="px-5 py-3 font-medium">Avis</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate">
                    Aucun avis déposé pour l&apos;instant.
                  </td>
                </tr>
              )}
              {reviews.map((r) => (
                <tr key={r.id} className="border-b border-black/5 last:border-0 align-top">
                  <td className="px-5 py-3 font-medium text-plum">{r.vendorName}</td>
                  <td className="px-5 py-3 text-slate">{r.authorName || "—"}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-plum">
                      <Star size={14} className="fill-festif text-festif" />
                      {r.rating}
                    </span>
                  </td>
                  <td className="max-w-xs px-5 py-3 text-slate">
                    {r.eventType && (
                      <span className="mb-1 inline-block rounded-md bg-festif-soft px-2 py-0.5 text-xs font-semibold text-festif">
                        {r.eventType}
                      </span>
                    )}
                    <p className="line-clamp-3">{r.body || "—"}</p>
                  </td>
                  <td className="px-5 py-3 text-slate">
                    {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        aria-label={`Supprimer l'avis de ${r.authorName ?? "cet auteur"}`}
                        disabled={busy === r.id}
                        onClick={() => setConfirmReview(r)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-festif-soft hover:text-festif disabled:opacity-60"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReview !== null}
        loading={busy === confirmReview?.id}
        title="Supprimer cet avis"
        message={
          confirmReview
            ? `L'avis de « ${confirmReview.authorName ?? "cet auteur"} » sur « ${confirmReview.vendorName} » sera définitivement supprimé.`
            : ""
        }
        onConfirm={doRemove}
        onCancel={() => setConfirmReview(null)}
      />
    </div>
  );
}
