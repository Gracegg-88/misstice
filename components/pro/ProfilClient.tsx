"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Plus,
  X,
  Upload,
  ExternalLink,
  BadgeCheck,
  Pencil,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CategorySelect from "@/components/pro/CategorySelect";
import type { ProVendor, VendorPackage, VendorPhoto } from "@/lib/pro-types";

export default function ProfilClient({
  vendor,
  packages,
  photos,
  categories,
}: {
  vendor: ProVendor;
  packages: VendorPackage[];
  photos: VendorPhoto[];
  categories: string[];
}) {
  const router = useRouter();

  // Infos éditables (vendor_profiles + vendors)
  const [info, setInfo] = useState({
    company: vendor.company ?? "",
    category: vendor.category ?? "",
    city: vendor.city ?? "",
    about: vendor.about ?? "",
    tagline: vendor.tagline ?? "",
    priceFrom: vendor.priceFrom ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Formules / tarifs (état optimiste local)
  const [pkgs, setPkgs] = useState<VendorPackage[]>(packages);
  const [newPkg, setNewPkg] = useState({ name: "", price: "", popular: false });
  const [newFeatures, setNewFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [addingPkg, setAddingPkg] = useState(false);

  // Édition d'une formule existante
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    name: "",
    price: "",
    popular: false,
  });
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [editFeatureInput, setEditFeatureInput] = useState("");

  const withEuro = (raw: string): string | null => {
    const v = raw.trim();
    if (!v) return null;
    return v.includes("€") ? v : `${v}€`;
  };

  const startEdit = (p: VendorPackage) => {
    setEditingId(p.id);
    setEditDraft({
      name: p.name,
      price: (p.price ?? "").replace(/€$/, ""),
      popular: p.popular,
    });
    setEditFeatures(p.features);
    setEditFeatureInput("");
  };

  const saveEdit = async () => {
    if (!editingId || !editDraft.name.trim()) return;
    const supabase = createClient();
    const payload = {
      name: editDraft.name.trim(),
      price: withEuro(editDraft.price),
      features: editFeatures,
      popular: editDraft.popular,
    };
    const { error: upErr } = await supabase
      .from("vendor_packages")
      .update(payload)
      .eq("id", editingId);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setPkgs((p) =>
      p.map((x) => (x.id === editingId ? { ...x, ...payload } : x))
    );
    setEditingId(null);
    router.refresh();
  };

  const addFeature = () => {
    const f = featureInput.trim();
    if (!f) return;
    setNewFeatures((p) => [...p, f]);
    setFeatureInput("");
  };

  // Garantit que la fiche (vendor_profiles) existe avant tout ajout qui la
  // référence (formules, photos). Renvoie un message d'erreur ou null.
  const ensureProfile = async (): Promise<string | null> => {
    if (!info.company.trim()) {
      return "Renseignez le nom de votre activité, puis « Enregistrer », avant d'ajouter une formule ou des photos.";
    }
    const supabase = createClient();
    const { error: e } = await supabase.from("vendor_profiles").upsert({
      id: vendor.profileId,
      company: info.company.trim(),
      category: info.category || null,
      city: info.city || null,
      about: info.about || null,
    });
    return e?.message ?? null;
  };

  // Photo principale (vendors.image)
  const [mainImage, setMainImage] = useState<string | null>(vendor.image);
  const [uploadingMain, setUploadingMain] = useState(false);
  const mainRef = useRef<HTMLInputElement>(null);

  // Book photos
  const [pics, setPics] = useState<VendorPhoto[]>(photos);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onUploadMain = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    setError("");
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${vendor.profileId}/main-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("vendor-photos")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setUploadingMain(false);
      setError(upErr.message);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("vendor-photos").getPublicUrl(path);
    setMainImage(publicUrl);
    setUploadingMain(false);
    if (mainRef.current) mainRef.current.value = "";
  };

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet";

  // --- Enregistrer les infos (crée la fiche si elle n'existe pas encore) ---
  const saveInfo = async () => {
    if (!info.company.trim()) {
      setError("Le nom de votre activité est obligatoire.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    const supabase = createClient();

    // vendor_profiles : upsert (crée ou met à jour).
    const { error: pErr } = await supabase.from("vendor_profiles").upsert({
      id: vendor.profileId,
      company: info.company.trim(),
      category: info.category || null,
      city: info.city || null,
      about: info.about || null,
    });
    if (pErr) {
      setSaving(false);
      setError(pErr.message);
      return;
    }

    // vendors (fiche annuaire) : met à jour si elle existe, sinon la crée.
    const { data: existing } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", vendor.profileId)
      .maybeSingle();

    const vErr = existing
      ? (
          await supabase
            .from("vendors")
            .update({
              name: info.company.trim(),
              category: info.category?.trim() || "Autre",
              city: info.city || null,
              tagline: info.tagline || null,
              price_from: info.priceFrom || null,
              image: mainImage || null,
            })
            .eq("id", (existing as { id: string }).id)
        ).error
      : (
          await supabase.from("vendors").insert({
            name: info.company.trim(),
            category: info.category?.trim() || "Autre",
            city: info.city || null,
            user_id: vendor.profileId,
            tagline: info.tagline || null,
            price_from: info.priceFrom || null,
            image: mainImage || null,
            verified: false,
          })
        ).error;

    setSaving(false);
    if (vErr) {
      setError(vErr.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  };

  // --- Formules ---
  const addPackage = async () => {
    const name = newPkg.name.trim();
    if (!name) return;
    setAddingPkg(true);
    setError("");
    const profErr = await ensureProfile();
    if (profErr) {
      setAddingPkg(false);
      setError(profErr);
      return;
    }
    const supabase = createClient();
    const position = pkgs.length;
    // Ajoute automatiquement « € » si l'utilisateur n'en a pas mis.
    const priceRaw = newPkg.price.trim();
    const price = priceRaw
      ? priceRaw.includes("€")
        ? priceRaw
        : `${priceRaw}€`
      : null;
    const { data, error: insErr } = await supabase
      .from("vendor_packages")
      .insert({
        vendor_id: vendor.profileId,
        name,
        price,
        features: newFeatures,
        popular: newPkg.popular,
        position,
      })
      .select("id, vendor_id, name, price, features, popular, position")
      .single();
    setAddingPkg(false);
    if (insErr || !data) {
      setError(insErr?.message ?? "Erreur lors de l'ajout.");
      return;
    }
    setPkgs((p) => [...p, data as VendorPackage]);
    setNewPkg({ name: "", price: "", popular: false });
    setNewFeatures([]);
    setFeatureInput("");
    router.refresh();
  };

  const deletePackage = async (id: string) => {
    setError("");
    const prev = pkgs;
    setPkgs((p) => p.filter((x) => x.id !== id));
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("vendor_packages")
      .delete()
      .eq("id", id);
    if (delErr) {
      setPkgs(prev);
      setError(delErr.message);
      return;
    }
    router.refresh();
  };

  // --- Book photos ---
  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError("");
    const supabase = createClient();

    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${vendor.profileId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("vendor-photos")
        .upload(path, file, { upsert: true });
      if (upErr) {
        setError(upErr.message);
        continue;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("vendor-photos").getPublicUrl(path);

      const { data, error: insErr } = await supabase
        .from("vendor_photos")
        .insert({
          vendor_id: vendor.profileId,
          url: publicUrl,
          position: pics.length,
        })
        .select("id, vendor_id, url, position")
        .single();
      if (insErr || !data) {
        setError(insErr?.message ?? "Erreur lors de l'enregistrement.");
        continue;
      }
      setPics((p) => [...p, data as VendorPhoto]);
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  };

  const deletePhoto = async (id: string) => {
    setError("");
    const prev = pics;
    setPics((p) => p.filter((x) => x.id !== id));
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("vendor_photos")
      .delete()
      .eq("id", id);
    if (delErr) {
      setPics(prev);
      setError(delErr.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Mon profil
          </h1>
          {vendor.verified && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-violet">
              <BadgeCheck size={15} />
              Vérifié par Misstice
            </p>
          )}
        </div>
        {vendor.vendorId && (
          <a
            href={`/prestataires/${vendor.vendorId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-plum hover:border-violet/40"
          >
            <ExternalLink size={15} />
            Aperçu public
          </a>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-2xl bg-festif-soft px-4 py-3 text-sm font-medium text-festif">
          {error}
        </p>
      )}

      {/* Infos */}
      <section className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-plum">
          Informations
        </h2>

        {/* Photo principale */}
        <div className="mt-4 flex items-center gap-4">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainImage}
              alt="Photo principale"
              className="h-20 w-20 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-violet-soft font-display text-2xl font-semibold text-violet">
              {(info.company.trim()[0] || "P").toUpperCase()}
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => mainRef.current?.click()}
              disabled={uploadingMain}
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-plum hover:border-violet/40 disabled:opacity-60"
            >
              <Upload size={15} />
              {uploadingMain ? "Envoi…" : "Changer la photo"}
            </button>
            <p className="mt-1 text-xs text-slate">
              Elle apparaît sur votre fiche et dans l&apos;annuaire.
            </p>
          </div>
          <input
            ref={mainRef}
            type="file"
            accept="image/*"
            onChange={onUploadMain}
            className="hidden"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-plum">Nom</label>
            <input
              value={info.company}
              onChange={(e) => setInfo({ ...info, company: e.target.value })}
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-plum">Catégorie</label>
            <div className="mt-1.5">
              <CategorySelect
                value={info.category}
                onChange={(v) => setInfo({ ...info, category: v })}
                options={categories}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-plum">Ville</label>
            <input
              value={info.city}
              onChange={(e) => setInfo({ ...info, city: e.target.value })}
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-plum">Accroche</label>
            <input
              value={info.tagline}
              onChange={(e) => setInfo({ ...info, tagline: e.target.value })}
              placeholder="ex. Reportage doux et lumineux"
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-plum">À partir de</label>
            <input
              value={info.priceFrom}
              onChange={(e) => setInfo({ ...info, priceFrom: e.target.value })}
              placeholder="ex. dès 800 €"
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-plum">À propos</label>
          <textarea
            rows={3}
            value={info.about}
            onChange={(e) => setInfo({ ...info, about: e.target.value })}
            className={`mt-1.5 ${inputCls}`}
          />
        </div>
      </section>

      {/* Services & tarifs */}
      <section className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-plum">
          Services &amp; tarifs
        </h2>

        {/* Formules existantes */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pkgs.map((p) =>
            editingId === p.id ? (
              /* --- Mode édition --- */
              <div
                key={p.id}
                className="rounded-2xl border border-violet bg-cream p-4"
              >
                <input
                  value={editDraft.name}
                  onChange={(e) =>
                    setEditDraft({ ...editDraft, name: e.target.value })
                  }
                  placeholder="Nom"
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-plum outline-none focus:border-violet"
                />
                <div className="relative mt-2">
                  <input
                    value={editDraft.price}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, price: e.target.value })
                    }
                    placeholder="Tarif"
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 pr-7 text-sm text-plum outline-none focus:border-violet"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate">
                    €
                  </span>
                </div>

                {/* Prestations */}
                <ul className="mt-2 space-y-1">
                  {editFeatures.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-2 text-sm text-plum"
                    >
                      <span className="flex items-start gap-1.5">
                        <Check
                          size={13}
                          className="mt-0.5 shrink-0 text-emerald"
                        />
                        {f}
                      </span>
                      <button
                        type="button"
                        aria-label="Retirer"
                        onClick={() =>
                          setEditFeatures((prev) =>
                            prev.filter((_, j) => j !== i)
                          )
                        }
                        className="text-slate hover:text-festif"
                      >
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-1.5">
                  <input
                    value={editFeatureInput}
                    onChange={(e) => setEditFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const f = editFeatureInput.trim();
                        if (f) {
                          setEditFeatures((prev) => [...prev, f]);
                          setEditFeatureInput("");
                        }
                      }
                    }}
                    placeholder="Ajouter une prestation"
                    className="w-full flex-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-plum outline-none focus:border-violet"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const f = editFeatureInput.trim();
                      if (f) {
                        setEditFeatures((prev) => [...prev, f]);
                        setEditFeatureInput("");
                      }
                    }}
                    className="shrink-0 rounded-lg border border-black/10 bg-white px-2 text-sm text-plum hover:border-violet/40"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <label className="mt-2 inline-flex items-center gap-2 text-sm text-plum">
                  <input
                    type="checkbox"
                    checked={editDraft.popular}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, popular: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-black/20 accent-violet"
                  />
                  «&nbsp;Le plus demandé&nbsp;»
                </label>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={!editDraft.name.trim()}
                    className="flex-1 rounded-lg bg-violet py-2 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-50"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-plum hover:bg-white"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              /* --- Affichage --- */
              <div
                key={p.id}
                className={`relative rounded-2xl border p-4 ${
                  p.popular ? "border-violet" : "border-black/10"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-violet px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    Le plus demandé
                  </span>
                )}
                <div className="absolute right-2.5 top-2.5 flex gap-1">
                  <button
                    type="button"
                    aria-label="Modifier la formule"
                    onClick={() => startEdit(p)}
                    className="text-slate hover:text-violet"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label="Supprimer la formule"
                    onClick={() => deletePackage(p.id)}
                    className="text-slate hover:text-festif"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="pr-12 font-display text-base font-semibold text-plum">
                  {p.name}
                </p>
                {p.price && (
                  <p className="mt-0.5 text-sm font-semibold text-violet">
                    {p.price}
                  </p>
                )}
                {p.features.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {p.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-sm text-slate"
                      >
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0 text-emerald"
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          )}
          {pkgs.length === 0 && (
            <p className="text-sm text-slate">
              Aucune formule pour le moment. Ajoutez-en une ci-dessous.
            </p>
          )}
        </div>

        {/* Ajout d'une formule */}
        <div className="mt-5 rounded-2xl bg-cream p-4">
          <p className="text-sm font-semibold text-plum">Ajouter une formule</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={newPkg.name}
              onChange={(e) => setNewPkg({ ...newPkg, name: e.target.value })}
              placeholder="Nom (ex. Repas assis)"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-plum outline-none focus:border-violet"
            />
            <div className="relative">
              <input
                value={newPkg.price}
                onChange={(e) => setNewPkg({ ...newPkg, price: e.target.value })}
                placeholder="Tarif (ex. 55)"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 pr-8 text-sm text-plum outline-none focus:border-violet"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate">
                €
              </span>
            </div>
          </div>

          {/* Prestations (puces) */}
          <div className="mt-3 flex gap-2">
            <input
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addFeature();
                }
              }}
              placeholder="Ajouter une prestation (ex. Service inclus)"
              className="w-full flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-plum outline-none focus:border-violet"
            />
            <button
              type="button"
              onClick={addFeature}
              className="shrink-0 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold text-plum hover:border-violet/40"
            >
              + Prestation
            </button>
          </div>
          {newFeatures.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {newFeatures.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs text-plum"
                >
                  {f}
                  <button
                    type="button"
                    aria-label="Retirer"
                    onClick={() =>
                      setNewFeatures((p) => p.filter((_, j) => j !== i))
                    }
                    className="text-slate hover:text-festif"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-plum">
              <input
                type="checkbox"
                checked={newPkg.popular}
                onChange={(e) =>
                  setNewPkg({ ...newPkg, popular: e.target.checked })
                }
                className="h-4 w-4 rounded border-black/20 accent-violet"
              />
              «&nbsp;Le plus demandé&nbsp;»
            </label>
            <button
              type="button"
              onClick={addPackage}
              disabled={addingPkg || !newPkg.name.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-50"
            >
              <Plus size={15} />
              Ajouter la formule
            </button>
          </div>
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
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {pics.map((photo, i) => (
            <div key={photo.id} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Réalisation ${i + 1}`}
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
              <button
                aria-label="Supprimer la photo"
                onClick={() => deletePhoto(photo.id)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-plum/70 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {pics.length === 0 && (
            <p className="col-span-full text-sm text-slate">
              Ajoutez vos plus belles réalisations pour valoriser votre profil.
            </p>
          )}
        </div>
        <p className="mt-3 text-xs text-slate">
          Visible uniquement par les membres connectés sur votre profil public.
        </p>
      </section>

      {error && <p className="mt-4 text-right text-sm text-festif">{error}</p>}

      {/* Save */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={saveInfo}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
        >
          <Check size={17} />
          {saving
            ? "Enregistrement…"
            : saved
            ? "Modifications enregistrées"
            : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}
