"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileForm({
  id,
  name: initialName,
  avatarUrl,
  email: initialEmail,
}: {
  id: string;
  name: string;
  avatarUrl: string | null;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName === "Admin" ? "" : initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMessage("");
  };

  const clearFlags = () => {
    setMessage("");
    setError("");
  };

  const save = async () => {
    setError("");
    setMessage("");

    if (password && password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password && password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    let avatar = avatarUrl;
    const notes: string[] = [];

    try {
      // 1. Photo
      if (file) {
        const ext = (file.name.split(".").pop() || "png").toLowerCase();
        const path = `${id}/avatar-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        avatar = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }

      // 2. Nom + avatar dans profiles
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ full_name: name.trim() || null, avatar_url: avatar })
        .eq("id", id);
      if (updErr) throw updErr;

      // 3. Email (déclenche un email de confirmation)
      const trimmedEmail = email.trim();
      if (trimmedEmail && trimmedEmail !== initialEmail) {
        const { error: mailErr } = await supabase.auth.updateUser({
          email: trimmedEmail,
        });
        if (mailErr) throw mailErr;
        notes.push(
          "Un e-mail de confirmation a été envoyé à la nouvelle adresse."
        );
      }

      // 4. Mot de passe
      if (password) {
        const { error: pwdErr } = await supabase.auth.updateUser({ password });
        if (pwdErr) throw pwdErr;
        notes.push("Mot de passe mis à jour.");
        setPassword("");
        setConfirm("");
      }

      setSaving(false);
      setMessage(
        notes.length ? notes.join(" ") : "Modifications enregistrées."
      );
      router.refresh();
    } catch (e) {
      setSaving(false);
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    }
  };

  const initial = (name.trim()[0] || "A").toUpperCase();

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      {/* Photo */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="h-28 w-28 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-28 w-28 items-center justify-center rounded-full bg-violet text-4xl font-semibold text-white">
              {initial}
            </span>
          )}
          <span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white text-violet shadow-md ring-1 ring-black/5">
            <Camera size={17} />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          aria-label="Changer la photo de profil"
          onChange={onPick}
          className="hidden"
        />
        <p className="mt-3 text-xs text-slate">Cliquez pour changer la photo</p>
      </div>

      {/* Informations */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-plum">Nom complet</label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFlags();
            }}
            placeholder="Votre nom"
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-plum">
            Adresse e-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFlags();
            }}
            autoComplete="off"
            placeholder="vous@exemple.com"
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet"
          />
        </div>
      </div>

      {/* Mot de passe */}
      <div className="mt-8 border-t border-black/5 pt-6">
        <h2 className="font-display text-lg font-semibold text-plum">
          Changer le mot de passe
        </h2>
        <p className="mt-1 text-xs text-slate">
          Laissez ces champs vides pour conserver votre mot de passe actuel.
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-plum">
              Nouveau mot de passe
            </label>
            <div className="relative mt-1.5">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFlags();
                }}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 pr-11 text-sm text-plum outline-none focus:border-violet"
              />
              <button
                type="button"
                aria-label={showPwd ? "Masquer" : "Afficher"}
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-plum"
              >
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-plum">
              Confirmer le mot de passe
            </label>
            <input
              type={showPwd ? "text" : "password"}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                clearFlags();
              }}
              autoComplete="new-password"
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet"
            />
          </div>
        </div>
      </div>

      {error && <p className="mt-5 text-sm text-festif">{error}</p>}

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-violet px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {message && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald">
            <Check size={16} />
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
