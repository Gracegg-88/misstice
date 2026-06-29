"use client";

import { useRef, useState } from "react";
import { Search, Heart, Plus, X, Link2, Upload } from "lucide-react";

type Idea = {
  id: number;
  title: string;
  cat: string;
  tags: string[];
  emoji: string;
  grad: string;
  vendor?: string;
  liked?: boolean;
  source?: string; // Pinterest / TikTok / Lien
  img?: string; // pour les uploads
};

const CATS = ["Tout", "Décoration", "Gâteaux", "Robes", "Fleurs", "Lieux", "Tables", "Coiffures", "Thèmes"];

const INITIAL: Idea[] = [
  { id: 1, title: "Mariage champêtre bohème", cat: "Thèmes", tags: ["Nature", "Blanc", "Or"], emoji: "🌿", grad: "from-emerald-soft to-festif-soft", vendor: "Studio Lumière", liked: true },
  { id: 2, title: "Gâteau 5 étages floral", cat: "Gâteaux", tags: ["Blanc", "Fleurs", "Élégant"], emoji: "🎂", grad: "from-festif-soft to-violet-soft", vendor: "Pâtisserie Royale" },
  { id: 3, title: "Déco mariage africain luxe", cat: "Décoration", tags: ["Doré", "Wax", "Moderne"], emoji: "✨", grad: "from-festif-soft to-emerald-soft", liked: true },
  { id: 4, title: "Centre de table pampas", cat: "Tables", tags: ["Bohème", "Beige", "Naturel"], emoji: "🌾", grad: "from-violet-soft to-festif-soft" },
  { id: 5, title: "Salle château illuminée", cat: "Lieux", tags: ["Luxe", "Chandelles", "Romantique"], emoji: "🏰", grad: "from-violet-soft to-emerald-soft" },
  { id: 6, title: "Robe mariée sirène dentelle", cat: "Robes", tags: ["Dentelle", "Ivoire", "Sirène"], emoji: "👗", grad: "from-festif-soft to-violet-soft" },
  { id: 7, title: "Table d'honneur rustique chic", cat: "Tables", tags: ["Bois", "Verdure", "Lin"], emoji: "🍃", grad: "from-emerald-soft to-violet-soft" },
  { id: 8, title: "Tresse couronnée fleurie", cat: "Coiffures", tags: ["Fleurs", "Tresse", "Naturel"], emoji: "💐", grad: "from-violet-soft to-festif-soft", liked: true },
  { id: 9, title: "Photo couple golden hour", cat: "Thèmes", tags: ["Coucher soleil", "Doré"], emoji: "📸", grad: "from-festif-soft to-emerald-soft", vendor: "Studio Lumière" },
  { id: 10, title: "Arche florale cérémonie", cat: "Fleurs", tags: ["Blanc", "Rose", "Luxuriant"], emoji: "🌸", grad: "from-festif-soft to-violet-soft", liked: true },
  { id: 11, title: "Gâteau nu fleuri 3 étages", cat: "Gâteaux", tags: ["Semi-nude", "Rustique"], emoji: "🍰", grad: "from-emerald-soft to-festif-soft" },
  { id: 12, title: "Mariage en Provence", cat: "Thèmes", tags: ["Lavande", "Extérieur", "Été"], emoji: "🌻", grad: "from-violet-soft to-emerald-soft" },
];

function detectSource(url: string) {
  const u = url.toLowerCase();
  if (u.includes("pinterest")) return "Pinterest";
  if (u.includes("tiktok")) return "TikTok";
  if (u.includes("instagram")) return "Instagram";
  return "Lien";
}

export default function InspirationPage() {
  const [ideas, setIdeas] = useState<Idea[]>(INITIAL);
  const [cat, setCat] = useState("Tout");
  const [query, setQuery] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const shown = ideas.filter((i) => {
    if (cat !== "Tout" && i.cat !== cat) return false;
    const q = query.trim().toLowerCase();
    if (q && !`${i.title} ${i.tags.join(" ")}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const toggleLike = (id: number) =>
    setIdeas((p) => p.map((i) => (i.id === id ? { ...i, liked: !i.liked } : i)));

  const importLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setIdeas((p) => [
      {
        id: Date.now(),
        title: title || "Idée importée",
        cat: "Tout",
        tags: [],
        emoji: "🔗",
        grad: "from-violet-soft to-festif-soft",
        source: detectSource(url),
        liked: true,
      },
      ...p,
    ]);
    setUrl("");
    setTitle("");
    setImportOpen(false);
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setIdeas((p) => [
      {
        id: Date.now(),
        title: file.name.replace(/\.[^.]+$/, ""),
        cat: "Tout",
        tags: ["Mon import"],
        emoji: "🖼️",
        grad: "from-emerald-soft to-violet-soft",
        source: "Upload",
        img: objectUrl,
        liked: true,
      },
      ...p,
    ]);
    setImportOpen(false);
  };

  const likedCount = ideas.filter((i) => i.liked).length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Inspiration
          </h1>
          <p className="mt-1 text-sm text-slate">
            {likedCount} idées sauvegardées dans votre moodboard
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
        {CATS.map((c) => (
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
      <div className="mt-6 columns-2 gap-4 sm:columns-3 lg:columns-4">
        {shown.map((i, idx) => (
          <div
            key={i.id}
            className="ev-stagger-item mb-4 break-inside-avoid overflow-hidden rounded-3xl border border-black/5 bg-white"
            style={{ ["--i" as string]: idx % 8 } as React.CSSProperties}
          >
            <div
              className={`relative flex items-center justify-center bg-gradient-to-br ${i.grad}`}
              style={{ height: i.img ? "auto" : `${110 + (idx % 3) * 36}px` }}
            >
              {i.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.img} alt={i.title} className="w-full object-cover" />
              ) : (
                <span className="text-4xl">{i.emoji}</span>
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
              {i.source && (
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-violet">
                  {i.source}
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="font-medium text-plum">{i.title}</p>
              {i.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {i.tags.map((t) => (
                    <span key={t} className="rounded-md bg-cream px-2 py-0.5 text-xs text-slate">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {i.vendor && (
                <p className="mt-2 text-xs font-medium text-violet">{i.vendor}</p>
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
          <div className="absolute inset-0" onClick={() => setImportOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-plum">
                Ajouter une idée
              </h3>
              <button onClick={() => setImportOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream">
                <X size={18} />
              </button>
            </div>

            <p className="text-sm font-medium text-plum">
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
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre (optionnel)"
                className="w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
              />
              <button className="w-full rounded-xl bg-violet py-2.5 text-sm font-semibold text-white hover:bg-violet-dark">
                Importer le lien
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-xs text-slate">
              <span className="h-px flex-1 bg-black/10" />
              ou
              <span className="h-px flex-1 bg-black/10" />
            </div>

            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet/40 py-3 text-sm font-semibold text-violet hover:bg-violet-soft"
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
          </div>
        </div>
      )}
    </div>
  );
}
