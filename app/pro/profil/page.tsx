"use client";

import { useRef, useState } from "react";
import { Check, Plus, X, Upload, ExternalLink, BadgeCheck } from "lucide-react";

type Pkg = { name: string; price: string };

export default function ProProfil() {
  const [info, setInfo] = useState({
    name: "Studio Lumière",
    category: "Photographe",
    city: "Paris",
    about:
      "Reportage doux et lumineux, sans poses figées. J'accompagne familles et particuliers pour des événements à la hauteur de vos attentes.",
  });
  const [languages, setLanguages] = useState(["Français", "Anglais"]);
  const [langInput, setLangInput] = useState("");
  const [packages, setPackages] = useState<Pkg[]>([
    { name: "Demi-journée", price: "dès 800 €" },
    { name: "Journée complète", price: "1 400 €" },
    { name: "Journée + album", price: "1 900 €" },
  ]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet";

  const addLang = () => {
    if (langInput.trim() && !languages.includes(langInput.trim())) {
      setLanguages((l) => [...l, langInput.trim()]);
    }
    setLangInput("");
  };
  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPhotos((p) => [...files.map((f) => URL.createObjectURL(f)), ...p]);
  };
  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Mon profil
          </h1>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-violet">
            <BadgeCheck size={15} />
            Vérifié par Misstice
          </p>
        </div>
        <a
          href="/prestataires/1"
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-plum hover:border-violet/40"
        >
          <ExternalLink size={15} />
          Aperçu public
        </a>
      </div>

      {/* Infos */}
      <section className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-plum">
          Informations
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-plum">Nom</label>
            <input value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} className={`mt-1.5 ${inputCls}`} />
          </div>
          <div>
            <label className="text-sm font-medium text-plum">Catégorie</label>
            <input value={info.category} onChange={(e) => setInfo({ ...info, category: e.target.value })} className={`mt-1.5 ${inputCls}`} />
          </div>
          <div>
            <label className="text-sm font-medium text-plum">Ville</label>
            <input value={info.city} onChange={(e) => setInfo({ ...info, city: e.target.value })} className={`mt-1.5 ${inputCls}`} />
          </div>
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-plum">À propos</label>
          <textarea rows={3} value={info.about} onChange={(e) => setInfo({ ...info, about: e.target.value })} className={`mt-1.5 ${inputCls}`} />
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-plum">Langues parlées</label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {languages.map((l) => (
              <span key={l} className="inline-flex items-center gap-1 rounded-lg bg-violet-soft px-2.5 py-1 text-sm font-medium text-violet">
                {l}
                <button aria-label={`Retirer ${l}`} onClick={() => setLanguages((ls) => ls.filter((x) => x !== l))}>
                  <X size={13} />
                </button>
              </span>
            ))}
            <input
              value={langInput}
              onChange={(e) => setLangInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLang())}
              placeholder="Ajouter…"
              className="w-28 rounded-lg border border-black/10 bg-cream px-2.5 py-1 text-sm outline-none focus:border-violet"
            />
          </div>
        </div>
      </section>

      {/* Services & tarifs */}
      <section className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-plum">
            Services &amp; tarifs
          </h2>
          <button
            onClick={() => setPackages((p) => [...p, { name: "Nouveau forfait", price: "sur devis" }])}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet px-3 py-2 text-sm font-semibold text-white hover:bg-violet-dark"
          >
            <Plus size={15} />
            Ajouter
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {packages.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                value={p.name}
                onChange={(e) => setPackages((ps) => ps.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                className={`flex-1 ${inputCls}`}
              />
              <input
                value={p.price}
                onChange={(e) => setPackages((ps) => ps.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                className={`w-36 ${inputCls}`}
              />
              <button aria-label="Supprimer" onClick={() => setPackages((ps) => ps.filter((_, j) => j !== i))} className="text-slate hover:text-plum">
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Book */}
      <section className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-plum">
            Mon book
          </h2>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-violet/40 px-3 py-2 text-sm font-semibold text-violet hover:bg-violet-soft"
          >
            <Upload size={15} />
            Ajouter des photos
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={onUpload} className="hidden" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt={`Réalisation ${i + 1}`} className="aspect-[4/3] w-full rounded-2xl object-cover" />
          ))}
          {/* placeholders existants */}
          {["from-violet to-festif", "from-festif to-emerald", "from-emerald to-violet", "from-violet to-emerald"].map((g, i) => (
            <div key={i} className={`aspect-[4/3] rounded-2xl bg-gradient-to-br ${g}`} />
          ))}
        </div>
        <p className="mt-3 text-xs text-slate">
          Visible uniquement par les membres connectés sur votre profil public.
        </p>
      </section>

      {/* Save */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={save}
          className="inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white hover:bg-violet-dark"
        >
          <Check size={17} />
          {saved ? "Modifications enregistrées" : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}
