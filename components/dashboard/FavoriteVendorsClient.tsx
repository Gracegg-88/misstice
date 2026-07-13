"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Star, MapPin, FileText, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFavorites } from "@/lib/useFavorites";

type FavVendor = {
  id: string;
  name: string;
  category: string;
  city: string | null;
  image: string | null;
  rating: number;
  grad: string;
};

export default function FavoriteVendorsClient() {
  const { ids, toggle } = useFavorites();
  const [vendors, setVendors] = useState<FavVendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setVendors([]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    (async () => {
      const supabase = createClient();
      try {
        const { data } = await supabase
          .from("vendors")
          .select("id, name, category, city, image, rating, grad")
          .in("id", ids);
        if (!alive) return;
        // On respecte l'ordre des favoris (les plus récents d'abord dans ids).
        const rows = (data as FavVendor[]) ?? [];
        const byId = new Map(rows.map((r) => [r.id, r]));
        setVendors(
          ids.map((id) => byId.get(id)).filter(Boolean) as FavVendor[]
        );
      } catch (e) {
        // On n'immobilise pas l'écran en cas d'erreur réseau.
        console.error("favorites load:", e);
      } finally {
        // finally garantit la sortie de l'état « Chargement… » même sur erreur.
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ids]);

  if (loading) {
    return <p className="mt-6 text-sm text-slate">Chargement des favoris…</p>;
  }

  if (vendors.length === 0) {
    return (
      <div className="mt-6 rounded-3xl border border-dashed border-black/10 bg-white p-12 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-festif-soft text-festif">
          <Heart size={22} />
        </span>
        <p className="mt-3 font-semibold text-plum">Aucun favori pour l&apos;instant</p>
        <p className="mt-1 text-sm text-slate">
          Ajoutez des prestataires en favori depuis l&apos;annuaire ; ils
          apparaîtront ici pour tous vos événements.
        </p>
        <a
          href="/prestataires"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
        >
          <Search size={16} />
          Explorer l&apos;annuaire
        </a>
      </div>
    );
  }

  return (
    <>
      <p className="mt-4 text-sm text-slate">
        Vos prestataires favoris, communs à tous vos événements.
      </p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v) => (
          <div
            key={v.id}
            className="overflow-hidden rounded-3xl border border-black/5 bg-white"
          >
            <div
              className={`relative flex h-28 items-end bg-gradient-to-br ${v.grad || "from-violet to-festif"} p-4`}
            >
              {v.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 font-display text-lg font-semibold text-plum">
                {v.name.charAt(0)}
              </span>
              <button
                type="button"
                onClick={() => toggle(v.id)}
                aria-label="Retirer des favoris"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-festif hover:bg-white"
              >
                <Heart size={16} className="fill-festif" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold text-plum">
                    {v.name}
                  </p>
                  <p className="text-sm text-slate">{v.category}</p>
                </div>
                {v.rating > 0 && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-plum">
                    <Star size={14} className="fill-festif text-festif" />
                    {v.rating.toFixed(1).replace(".", ",")}
                  </span>
                )}
              </div>
              {v.city && (
                <p className="mt-1 flex items-center gap-1 text-sm text-slate">
                  <MapPin size={13} />
                  {v.city}
                </p>
              )}
              <div className="mt-4 flex items-center gap-2 border-t border-black/5 pt-4">
                <Link
                  href={`/prestataires/${v.id}?devis=1`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet px-3 py-2 text-sm font-semibold text-white hover:bg-violet-dark"
                >
                  <FileText size={14} />
                  Demander un devis
                </Link>
                <Link
                  href={`/prestataires/${v.id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-plum/15 px-3 py-2 text-sm font-semibold text-plum hover:border-plum/30"
                >
                  Fiche
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
