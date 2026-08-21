"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ShieldCheck, Lightbulb, ArrowRight } from "lucide-react";

export default function SiretVerification({
  siret,
  verifiedAt,
  companyName,
}: {
  siret: string | null;
  verifiedAt: string | null;
  companyName: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(siret ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const digits = value.replace(/\s/g, "");
  const canSubmit = /^\d{14}$/.test(digits) && !loading;
  const guideUrl = process.env.NEXT_PUBLIC_SIRET_GUIDE_URL || "/devenir-prestataire";

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vendor/siret", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siret: digits }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "La vérification a échoué.");
      }
      // Le bandeau ci-dessus (verifiedAt) reflète déjà le succès après ce
      // rafraîchissement — pas besoin d'un second message de confirmation.
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-plum">
        <ShieldCheck size={20} className="text-violet" />
        Vérification SIRET
      </h2>
      <p className="mt-1 text-sm text-slate">
        Confirmez l'existence légale de votre entreprise pour rassurer vos
        clients. Vérification gratuite auprès du répertoire officiel des
        entreprises françaises.
      </p>

      {verifiedAt && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-soft px-4 py-3 text-sm text-emerald">
          <BadgeCheck size={18} />
          <span>
            SIRET vérifié{companyName ? ` · ${companyName}` : ""} (le{" "}
            {new Date(verifiedAt).toLocaleDateString("fr-FR")})
          </span>
        </div>
      )}

      {/* Encart pédagogique, non bloquant : n'apparaît que tant qu'aucun SIRET
          n'a été renseigné. Disparaît de lui-même dès que `siret`/`verifiedAt`
          sont renseignés (rafraîchis après une vérification réussie via
          router.refresh() ci-dessus) — aucun statut ni palier supplémentaire
          en base, purement informatif. */}
      {!siret && !verifiedAt && (
        <div className="mt-4 rounded-2xl border border-festif/20 bg-festif-soft px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-plum">
            <Lightbulb size={17} className="text-festif" />
            Pas encore de SIRET ?
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate">
            C&apos;est gratuit et ça prend environ 15 minutes. Créez votre
            statut auto-entrepreneur pour débloquer votre badge vérifié et
            recevoir vos paiements.
          </p>
          <a
            href={guideUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-violet hover:text-violet-dark"
          >
            Voir le guide
            <ArrowRight size={15} />
          </a>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          inputMode="numeric"
          maxLength={14}
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d\s]/g, ""))}
          placeholder="14 chiffres, ex. 12345678900012"
          className="flex-1 rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet"
        />
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-50"
        >
          {loading ? "Vérification…" : verifiedAt ? "Mettre à jour" : "Vérifier"}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-festif-soft px-4 py-3 text-sm text-festif">
          {error}
        </p>
      )}
    </div>
  );
}
