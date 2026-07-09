"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Eye, EyeOff } from "lucide-react";
import Header from "@/components/Header";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Vérifie qu'une session de récupération est bien active
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setError(
          "Lien invalide ou expiré. Recommencez depuis « Mot de passe oublié »."
        );
      }
      setReady(true);
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updErr } = await supabase.auth.updateUser({ password });
    if (updErr) {
      setLoading(false);
      setError(updErr.message);
      return;
    }
    setDone(true);
    setLoading(false);
    setTimeout(() => {
      router.push("/auth");
      router.refresh();
    }, 1800);
  };

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-white py-3 pl-11 pr-11 text-sm text-plum outline-none placeholder:text-slate focus:border-violet";

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-cream bg-cover bg-center bg-no-repeat bg-[url('/background_login_mobile.png')] sm:bg-[url('/background_login.png')]">
      <Header />

      <div className="flex flex-1 items-center justify-center overflow-hidden px-5 py-4">
        <div className="ev-fade-in w-full max-w-sm rounded-3xl border border-black/5 bg-white/95 p-5 shadow-xl backdrop-blur-sm sm:p-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" aria-hidden="true" className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-center font-display text-3xl font-semibold text-plum">
            Nouveau mot de passe
          </h1>
          <p className="mt-2 text-center text-sm text-slate">
            Choisissez un nouveau mot de passe pour votre compte.
          </p>

          {done ? (
            <p className="mt-6 rounded-xl bg-emerald-soft px-4 py-3 text-center text-sm text-emerald">
              Mot de passe mis à jour. Redirection vers la connexion…
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-plum">
                  Nouveau mot de passe
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate"
                  />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    disabled={!ready}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    aria-label={showPwd ? "Masquer" : "Afficher"}
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-plum"
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-plum">
                  Confirmer le mot de passe
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate"
                  />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    disabled={!ready}
                    className={inputCls}
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-festif-soft px-4 py-3 text-sm text-festif">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !ready}
                className="w-full rounded-xl bg-violet py-3.5 text-base font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-70"
              >
                {loading ? "Enregistrement…" : "Mettre à jour"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
