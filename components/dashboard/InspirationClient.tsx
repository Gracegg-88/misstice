"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Heart, Plus, X, Link2, Upload, Trash2, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import type { InspirationIdea } from "@/lib/dashboard-types";

const DEFAULT_CATS = [
  "Décoration",
  "Gâteaux",
  "Robes",
  "Fleurs",
  "Lieux",
  "Tables",
  "Coiffures",
  "Thèmes",
];

const GRADS = [
  "from-emerald-soft to-festif-soft",
  "from-festif-soft to-violet-soft",
  "from-festif-soft to-emerald-soft",
  "from-violet-soft to-festif-soft",
  "from-violet-soft to-emerald-soft",
  "from-emerald-soft to-violet-soft",
];

function detectSource(url: string) {
  const u = url.toLowerCase();
  if (u.includes("pinterest")) return "Pinterest";
  if (u.includes("tiktok")) return "TikTok";
  if (u.includes("instagram")) return "Instagram";
  return "Lien";
}

export default function InspirationClient({
  eventId,
  initial,
}: {
  eventId: string;
  initial: InspirationIdea[];
}) {
  const router = useRouter();
  const [ideas, setIdeas] = useState<InspirationIdea[]>(initial);
  const [cat, setCat] = useState("Tout");
  const [query, setQuery] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Catégories existantes = union des défauts + celles réellement utilisées.
  const catOptions = useMemo(() => {
    const used = ideas
      .map((i) => i.category?.trim())
      .filter((c): c is string => !!c);
    return Array.from(new Set([...DEFAULT_CATS, ...used])).sort((a, b) =>
      a.localeCompare(b, "fr")
    );
  }, [ideas]);

  // Onglets de filtre : « Tout » + les catégories existantes.
  const cats = useMemo(() => ["Tout", ...catOptions], [catOptions]);

  const shown = ideas.filter((i) => {
    if (cat !== "Tout" && i.category !== cat) return false;
    const q = query.trim().toLowerCase();
    if (
      q &&
      !`${i.title ?? ""} ${i.tags.join(" ")}`.toLowerCase().includes(q)
    )
      return false;
    return true;
  });

  const likedCount = ideas.filter((i) => i.liked).length;

  const resetForm = () => {
    setUrl("");
    setTitle("");
    setCategory("");
    setError("");
  };

  const toggleLike = async (id: string) => {
    const idea = ideas.find((i) => i.id === id);
    if (!idea) return;
    const next = !idea.liked;
    setIdeas((p) => p.map((i) => (i.id === id ? { ...i, liked: next } : i)));
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("inspiration_ideas")
      .update({ liked: next })
      .eq("id", id);
    if (upErr) {
      // Rollback en cas d'échec.
      setIdeas((p) =>
        p.map((i) => (i.id === id ? { ...i, liked: !next } : i))
      );
      return;
    }
    router.refresh();
  };

  const deleteIdea = async (id: string) => {
    const prev = ideas;
    setIdeas((p) => p.filter((i) => i.id !== id));
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("inspiration_ideas")
      .delete()
      .eq("id", id);
    if (delErr) {
      setIdeas(prev);
      return;
    }
    router.refresh();
  };

  // Insère une idée en base et met à jour la liste.
  const insertIdea = async (payload: {
    image_url: string;
    media_type: "image" | "video";
    source: string | null;
    source_url?: string | null;
    title: string | null;
    category: string | null;
    tags: string[];
  }) => {
    const supabase = createClient();
    const { data, error: insErr } = await supabase
      .from("inspiration_ideas")
      .insert({ event_id: eventId, liked: false, source_url: null, ...payload })
      .select(
        "id, event_id, title, category, tags, image_url, source, source_url, liked, media_type"
      )
      .single();
    if (insErr || !data) {
      throw new Error(insErr?.message ?? "Enregistrement impossible.");
    }
    setIdeas((p) => [data as InspirationIdea, ...p]);
    resetForm();
    setImportOpen(false);
    router.refresh();
  };

  const importLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    setError("");
    try {
      // 1. Extraire le vrai média du lien (og:image / og:video ou média direct).
      const res = await fetch(
        `/api/extract-media?url=${encodeURIComponent(url.trim())}`
      );
      const ext = await res.json();
      if (!res.ok || !ext.mediaUrl) {
        throw new Error(ext.error ?? "Média introuvable pour ce lien.");
      }
      let mediaUrl: string = ext.mediaUrl;
      // On conserve l'INTENTION (vidéo/image) donnée par l'extraction : une
      // vidéo importée reste une vidéo même si on n'héberge que sa miniature.
      const type: "image" | "video" = ext.type === "video" ? "video" : "image";

      // 2. Héberger la miniature sur Cloudinary si configuré (affichage uniforme).
      if (cloudinaryConfigured()) {
        const up = await uploadToCloudinary(mediaUrl);
        mediaUrl = up.url;
      }

      await insertIdea({
        image_url: mediaUrl,
        media_type: type,
        source: detectSource(url),
        source_url: url.trim(), // lien d'origine → bouton lecture
        title: title.trim() || null,
        category: category.trim() || null,
        tags: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import impossible.");
    } finally {
      setSaving(false);
    }
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");

    // Garde de taille (Cloudinary gratuit : ~100 Mo vidéo ; Supabase ~50 Mo).
    const maxMo = isVideo ? 100 : 25;
    if (file.size > maxMo * 1024 * 1024) {
      setError(
        `Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(0)} Mo). ` +
          `Maximum ${maxMo} Mo pour ${isVideo ? "une vidéo" : "une image"}.`
      );
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setSaving(true);
    setError("");
    try {
      let mediaUrl: string;
      let type: "image" | "video";

      if (cloudinaryConfigured()) {
        const up = await uploadToCloudinary(file);
        mediaUrl = up.url;
        type = up.type;
      } else {
        // Repli : Supabase Storage (bucket `inspiration`).
        const supabase = createClient();
        const extn = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
        const path = `${eventId}/${Date.now()}.${extn}`;
        const { error: upErr } = await supabase.storage
          .from("inspiration")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) throw new Error(upErr.message);
        mediaUrl = supabase.storage
          .from("inspiration")
          .getPublicUrl(path).data.publicUrl;
        type = isVideo ? "video" : "image";
      }

      await insertIdea({
        image_url: mediaUrl,
        media_type: type,
        source: "Upload",
        // Le titre saisi prime ; à défaut, le nom du fichier.
        title: title.trim() || file.name.replace(/\.[^.]+$/, "") || null,
        category: category.trim() || null,
        tags: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ajout impossible.");
    } finally {
      setSaving(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Inspiration
          </h1>
          <p className="mt-1 text-sm text-slate">
            {ideas.length} idée{ideas.length > 1 ? "s" : ""} sauvegardée
            {ideas.length > 1 ? "s" : ""} dans votre moodboard
            {likedCount > 0 ? ` · ${likedCount} ❤️` : ""}
          </p>
        </div>
        <button
          onClick={() => setImportOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
        >
          <Plus size={16} />
          Ajouter une idée
        </button>
      </div>

      {/* Recherche */}
      <div className="relative mt-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une idée…"
          className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-violet"
        />
      </div>

      {/* Catégories */}
      <div className="mt-4 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              cat === c ? "bg-violet text-white" : "bg-white text-slate hover:text-plum"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Moodboard masonry */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((i, idx) => (
          <div
            key={i.id}
            className="ev-stagger-item group flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white"
            style={{ ["--i" as string]: idx % 8 } as React.CSSProperties}
          >
            <div
              className={`relative aspect-[4/5] overflow-hidden bg-gradient-to-br ${
                GRADS[idx % GRADS.length]
              }`}
            >
              {i.media_type === "video" && !i.source_url ? (
                // Vidéo téléversée (fichier réel) → lecture inline.
                <video
                  src={i.image_url}
                  controls
                  playsInline
                  className="h-full w-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={i.image_url}
                  alt={i.title ?? "Inspiration"}
                  // Images externes (Pinterest…) : pas de referrer → évite le
                  // blocage anti-hotlink. Fallback dégradé si l'URL est morte.
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}

              {/* Vidéo importée (TikTok/Insta/Pinterest) : miniature + lecture
                  vers la source (la vidéo n'est pas lisible en ligne). */}
              {i.media_type === "video" && i.source_url && (
                <a
                  href={i.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Lire la vidéo sur la source"
                  className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors hover:bg-black/20"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-violet shadow-lg">
                    <Play size={24} className="ml-0.5 fill-violet" />
                  </span>
                </a>
              )}
              <button
                aria-label={i.liked ? "Retirer du moodboard" : "Sauvegarder"}
                onClick={() => toggleLike(i.id)}
                className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  i.liked ? "bg-festif text-white" : "bg-white/90 text-slate hover:text-festif"
                }`}
              >
                <Heart size={15} className={i.liked ? "fill-white" : ""} />
              </button>
              <button
                aria-label="Supprimer l'idée"
                onClick={() => deleteIdea(i.id)}
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate opacity-0 transition-opacity hover:text-festif group-hover:opacity-100"
              >
                <Trash2 size={15} />
              </button>
              {i.source && (
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-violet">
                  {i.source}
                </span>
              )}
            </div>
            <div className="p-4">
              {i.title && <p className="font-medium text-plum">{i.title}</p>}
              {i.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {i.tags.map((t) => (
                    <span key={t} className="rounded-md bg-cream px-2 py-0.5 text-xs text-slate">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {i.category && (
                <p className="mt-2 text-xs font-medium text-violet">{i.category}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate">Aucune idée pour ce filtre.</p>
      )}

      {/* Modale d'import */}
      {importOpen && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center bg-plum/50 sm:items-center sm:p-6">
          <div
            className="absolute inset-0"
            onClick={() => {
              setImportOpen(false);
              resetForm();
            }}
          />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-plum">
                Ajouter une idée
              </h3>
              <button
                onClick={() => {
                  setImportOpen(false);
                  resetForm();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream"
              >
                <X size={18} />
              </button>
            </div>

            {/* Titre & catégorie — communs à l'import ET au téléversement */}
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre (optionnel)"
                className="w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
              />
              <div>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Catégorie — choisir ci-dessous ou créer"
                  list="insp-categories"
                  className="w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                />
                <datalist id="insp-categories">
                  {catOptions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {/* Sélecteur visible des catégories existantes (mobile-friendly). */}
                {catOptions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {catOptions.map((c) => {
                      const active = category.trim() === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCategory(active ? "" : c)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            active
                              ? "bg-violet text-white"
                              : "bg-cream text-slate hover:text-plum"
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <p className="mt-5 text-sm font-medium text-plum">
              Importer depuis un lien
            </p>
            <p className="text-xs text-slate">Pinterest, TikTok, Instagram…</p>
            <form onSubmit={importLink} className="mt-3 space-y-3">
              <div className="relative">
                <Link2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://pinterest.com/pin/…"
                  className="w-full rounded-xl border border-black/10 bg-cream py-2.5 pl-11 pr-4 text-sm outline-none focus:border-violet"
                />
              </div>
              <button
                disabled={saving}
                className="w-full rounded-xl bg-violet py-2.5 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
              >
                {saving ? "Import…" : "Importer le lien"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-xs text-slate">
              <span className="h-px flex-1 bg-black/10" />
              ou
              <span className="h-px flex-1 bg-black/10" />
            </div>

            <button
              onClick={() => fileRef.current?.click()}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet/40 py-3 text-sm font-semibold text-violet hover:bg-violet-soft disabled:opacity-60"
            >
              <Upload size={16} />
              Téléverser une photo / vidéo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              onChange={onUpload}
              className="hidden"
            />
            {saving && (
              <p className="mt-3 text-center text-sm text-slate">
                Envoi en cours…
              </p>
            )}
            {error && <p className="mt-3 text-sm text-festif">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
