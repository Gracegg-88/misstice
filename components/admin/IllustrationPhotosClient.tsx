"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type IllustrationPhoto = {
  id: string;
  category: string;
  url: string;
  position: number;
};

/**
 * Photos d'illustration par catégorie (4-6 recommandées) : le prestataire
 * peut choisir l'une d'elles comme couverture tant qu'il n'a pas mis la
 * sienne (voir CoverPicker.tsx, composants/pro/). Tant qu'une catégorie n'a
 * aucune photo ici, la fiche garde son affichage actuel.
 */
export default function IllustrationPhotosClient({
  categories,
  photos,
}: {
  categories: string[];
  photos: IllustrationPhoto[];
}) {
  const router = useRouter();
  const [category, setCategory] = useState(categories[0] ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const shown = photos.filter((p) => p.category === category);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0 || !category) return;
    setUploading(true);
    setError("");
    const supabase = createClient();

    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${category}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("category-photos")
        .upload(path, file);
      if (upErr) {
        setError(upErr.message);
        continue;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("category-photos").getPublicUrl(path);
      const { error: insErr } = await supabase
        .from("category_illustration_photos")
        .insert({ category, url: publicUrl, position: shown.length });
      if (insErr) setError(insErr.message);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  };

  const remove = async (id: string) => {
    setError("");
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("category_illustration_photos")
      .delete()
      .eq("id", id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Photos d&apos;illustration
      </h1>
      <p className="mt-1 text-sm text-slate">
        4 à 6 photos par catégorie, libres de droits. Un prestataire peut en
        choisir une comme couverture tant qu&apos;il n&apos;a pas mis la
        sienne (mention « Photo d&apos;illustration » affichée).
      </p>

      {error && (
        <p className="mt-4 rounded-2xl bg-garnet-soft px-4 py-3 text-sm font-medium text-garnet">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-plum outline-none focus:border-violet"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-violet/40 px-3 py-2 text-sm font-semibold text-violet hover:bg-violet-soft disabled:opacity-60"
        >
          <Upload size={15} />
          {uploading ? "Envoi…" : "Ajouter des photos"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onUpload}
          className="hidden"
        />
        <span className="text-sm text-slate">
          {shown.length} photo{shown.length > 1 ? "s" : ""} pour « {category} »
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {shown.map((p) => (
          <div key={p.id} className="group relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt=""
              className="aspect-[4/3] w-full rounded-2xl object-cover"
            />
            <button
              aria-label="Supprimer la photo"
              onClick={() => remove(p.id)}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-plum/70 text-white opacity-0 transition group-hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {shown.length === 0 && (
          <p className="col-span-full text-sm text-slate">
            Aucune photo pour cette catégorie pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}
