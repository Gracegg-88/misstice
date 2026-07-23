"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import Header from "@/components/Header";
import { safeNext } from "@/lib/safe-next";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // Lien « Créer un compte » : on propage le paramètre `next` (ex. invitation)
  // pour que l'inscription redirige au bon endroit ensuite.
  const [signupHref, setSignupHref] = useState("/creer");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const raw = safeNext(sp.get("next"), "");
    if (raw) {
      setSignupHref(`/creer?next=${encodeURIComponent(raw)}`);
    }
    // Retour de /auth/callback en échec (ex. lien de réinitialisation ou
    // d'invitation expiré/déjà utilisé) : sans ce message, la page semblait
    // juste se recharger sans rien dire.
    if (sp.get("error")) {
      setError(
        "Ce lien est invalide ou a expiré. Merci de recommencer (ex. redemandez un lien de réinitialisation)."
      );
    }
  }, []);

  const forgot = async () => {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Saisissez d'abord votre adresse e-mail ci-dessus.");
      return;
    }
    const supabase = createClient();
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/auth/confirm?next=/auth/reset` }
    );
    if (resetErr) {
      setError(resetErr.message);
      return;
    }
    setNotice(
      "Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé."
    );
  };

  const go = async () => {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInErr) {
      setLoading(false);
      setError(
        signInErr.message.includes("Invalid login")
          ? "Email ou mot de passe incorrect."
          : signInErr.message
      );
      return;
    }

    // Le système détecte le rôle et redirige vers le bon espace.
    // Anti open-redirect : uniquement un chemin interne (backslash inclus).
    const next =
      safeNext(new URLSearchParams(window.location.search).get("next"), "") ||
      null;
    let dest = next;
    if (!dest) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id ?? "")
        .single();
      dest =
        profile?.role === "admin"
          ? "/admin"
          : profile?.role === "prestataire"
            ? "/pro"
            : "/dashboard";
    }
    router.push(dest);
    router.refresh();
  };

  const goGoogle = async () => {
    setError("");
    const supabase = createClient();
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthErr) setError(oauthErr.message);
  };

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-white py-2.5 pl-11 pr-4 text-sm text-plum outline-none placeholder:text-slate focus:border-violet";

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-cream bg-cover bg-center bg-no-repeat bg-[url('/background_login_mobile.png')] sm:bg-[url('/background_login.png')]">
      <Header />

      <div className="flex flex-1 items-center justify-center overflow-hidden px-5 py-1">
        <div className="ev-fade-in w-full max-w-sm rounded-3xl border border-black/5 bg-white/95 px-5 py-4 shadow-xl backdrop-blur-sm sm:px-6 sm:py-5">
          {/* Favicon Misstice (étincelle) */}
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-violet-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" aria-hidden="true" className="h-5 w-5" />
          </div>

          <h1 className="mt-2.5 text-center font-display text-xl font-semibold tracking-tight text-plum">
            Connexion à Misstice
          </h1>
          <p className="mt-1 text-center text-xs leading-snug text-slate">
            Vos événements et vos prestataires en un seul endroit.
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={goGoogle}
            className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-black/10 bg-white py-2.5 text-sm font-semibold text-plum transition-colors hover:bg-cream"
          >
            <GoogleIcon />
            Continuer avec Google
          </button>

          <div className="my-2.5 flex items-center gap-3 text-xs text-slate">
            <span className="h-px flex-1 bg-black/10" />
            ou connectez-vous avec votre email
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <form
            suppressHydrationWarning
            onSubmit={(e) => {
              e.preventDefault();
              go();
            }}
            className="space-y-2"
          >
            <div suppressHydrationWarning>
              <label className="text-sm font-medium text-plum">Adresse email</label>
              <div className="relative mt-1">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
                <input
                  required
                  suppressHydrationWarning
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@domaine.com"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-plum">Mot de passe</label>
              <div className="relative mt-1.5" suppressHydrationWarning>
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
                <input
                  required
                  suppressHydrationWarning
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-plum"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                type="button"
                onClick={forgot}
                className="mt-1.5 inline-block text-sm font-medium text-violet hover:text-violet-dark"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {error && (
              <p className="rounded-xl bg-festif-soft px-4 py-3 text-sm text-festif">
                {error}
              </p>
            )}

            {notice && (
              <p className="rounded-xl bg-emerald-soft px-4 py-3 text-sm text-emerald">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet py-3 text-base font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-70"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="mt-3 text-center text-sm text-slate">
            Pas encore de compte ?{" "}
            <a href={signupHref} className="font-semibold text-violet">
              Créer un compte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
