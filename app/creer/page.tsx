"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import { ArrowLeft, Check, Eye, EyeOff, PartyPopper } from "lucide-react";

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

const inputCls =
  "w-full rounded-xl border border-black/10 bg-cream px-4 py-1.5 text-sm text-plum outline-none focus:border-violet";

export default function CreerPage() {
  const router = useRouter();
  const [type, setType] = useState<"particulier" | "professionnel">("particulier");
  const [step, setStep] = useState(0);
  const [showPwd, setShowPwd] = useState(false);
  // Destination après inscription (ex. /invitation/<id> pour rejoindre une équipe).
  const [nextParam, setNextParam] = useState<string | null>(null);

  // Présélection du parcours prestataire via ?type=pro (depuis « Je suis
  // prestataire » / « Devenir prestataire »). Lu au montage pour éviter tout
  // décalage d'hydratation. On récupère aussi `next` (invitation).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("type");
    if (t === "pro" || t === "professionnel") setType("professionnel");
    const n = sp.get("next");
    if (n && n.startsWith("/") && !n.startsWith("//")) setNextParam(n);
  }, []);

  // données
  const [account, setAccount] = useState({ name: "", email: "", password: "" });
  const [pro, setPro] = useState({ company: "", category: "", city: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Le particulier ne crée qu'un compte ; ses événements se créent ensuite
  // depuis le dashboard. Le prestataire renseigne en plus sa fiche.
  const steps = type === "particulier" ? ["Compte"] : ["Compte", "Profil pro"];
  const last = steps.length - 1;

  const next = () => setStep((s) => Math.min(s + 1, last));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const goGoogle = async () => {
    setError("");
    const supabase = createClient();
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthErr) setError(oauthErr.message);
  };

  const finish = async () => {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const role = type === "professionnel" ? "prestataire" : "particulier";

    // 1. Création du compte (le profil est créé automatiquement par un trigger).
    const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
      email: account.email.trim(),
      password: account.password,
      options: {
        data: {
          full_name: account.name.trim(),
          role,
          // Repris par le trigger handle_new_user pour créer la fiche pro
          // même si la confirmation d'email est activée (pas de session).
          company: pro.company.trim(),
          category: pro.category.trim(),
          city: pro.city.trim(),
        },
      },
    });

    if (signUpErr) {
      setLoading(false);
      setError(
        signUpErr.message.includes("registered")
          ? "Un compte existe déjà avec cet email. Connectez-vous."
          : signUpErr.message
      );
      return;
    }

    // Si la confirmation d'email est activée, aucune session n'est ouverte :
    // on ne peut pas encore écrire côté DB (RLS). On informe l'utilisateur.
    if (!signUp.session) {
      setLoading(false);
      setError(
        "Compte créé ! Vérifiez votre boîte mail pour confirmer, puis connectez-vous. " +
          "(Astuce dev : désactivez « Confirm email » dans Supabase → Auth pour aller plus vite.)"
      );
      return;
    }

    try {
      // Inscription via une invitation : on va d'abord accepter l'invitation
      // (page /invitation/<id>), qui redirige ensuite vers le dashboard avec
      // l'événement rejoint sélectionné.
      if (nextParam) {
        router.push(nextParam);
        return;
      }

      if (type === "professionnel") {
        // La fiche prestataire (vendor_profiles + vendors annuaire) est créée
        // automatiquement par le trigger handle_new_user à partir des
        // métadonnées — pas d'insert client nécessaire.
        router.push("/pro");
        return;
      }

      // Particulier : on l'emmène sur son dashboard, où il pourra créer
      // un ou plusieurs événements.
      router.push("/dashboard");
    } catch (e) {
      setLoading(false);
      setError(
        e instanceof Error
          ? e.message
          : "Une erreur est survenue pendant la création."
      );
    }
  };

  // validation minimale pour activer "Continuer / Créer"
  const canSubmit =
    step === 0
      ? account.email.trim() !== "" && account.password.trim() !== ""
      : pro.company.trim() !== "" && pro.category.trim() !== "";

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-cream bg-cover bg-center bg-no-repeat bg-[url('/background_signup_mobile.png')] sm:bg-[url('/background_login.png')]">
      <Header />

      <div className="flex flex-1 items-center justify-center overflow-hidden px-5 py-2">
        <div className="ev-fade-in w-full max-w-sm rounded-3xl border border-black/5 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
          {/* Stepper (seulement pour le parcours pro, à 2 étapes) */}
          {steps.length > 1 && (
            <div className="flex w-full items-center">
              {steps.map((s, i) => (
                <div key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        i < step
                          ? "bg-emerald text-white"
                          : i === step
                          ? "bg-violet text-white"
                          : "bg-cream text-slate"
                      }`}
                    >
                      {i < step ? <Check size={15} /> : i + 1}
                    </span>
                    <span className="mt-1 text-[11px] text-slate">{s}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`mx-1 h-0.5 flex-1 ${
                        i < step ? "bg-emerald" : "bg-black/10"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div key={step} className={`ev-fade-in ${steps.length > 1 ? "mt-3" : ""}`}>
            {/* ÉTAPE 0 — Compte */}
            {step === 0 && (
              <div>
                <h1 className="font-display text-xl font-semibold tracking-tight text-plum">
                  Créez votre compte
                </h1>
                <p className="mt-1 text-sm text-slate">
                  Gratuit. Vous ne payez que les prestataires que vous réservez.
                </p>

                {/* Type de compte */}
                <div className="mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-cream p-1">
                  {(["particulier", "professionnel"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setType(t);
                        setStep(0);
                      }}
                      className={`rounded-xl py-1.5 text-sm font-semibold capitalize transition-colors ${
                        type === t ? "bg-violet text-white" : "text-slate hover:text-plum"
                      }`}
                    >
                      {t === "particulier" ? "J'organise" : "Je suis prestataire"}
                    </button>
                  ))}
                </div>

                <button
                  onClick={goGoogle}
                  className="mt-2 flex w-full items-center justify-center gap-3 rounded-xl border border-black/10 bg-white py-1.5 text-sm font-semibold text-plum hover:bg-cream"
                >
                  <GoogleIcon />
                  Continuer avec Google
                </button>
                <div className="my-2 flex items-center gap-3 text-xs text-slate">
                  <span className="h-px flex-1 bg-black/10" />
                  ou avec votre email
                  <span className="h-px flex-1 bg-black/10" />
                </div>

                <div className="space-y-2">
                  <input
                    placeholder="Prénom et nom"
                    value={account.name}
                    onChange={(e) => setAccount({ ...account, name: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    suppressHydrationWarning
                    type="email"
                    placeholder="vous@email.com"
                    value={account.email}
                    onChange={(e) => setAccount({ ...account, email: e.target.value })}
                    className={inputCls}
                  />
                  <div className="relative">
                    <input
                      suppressHydrationWarning
                      type={showPwd ? "text" : "password"}
                      placeholder="Mot de passe"
                      value={account.password}
                      onChange={(e) => setAccount({ ...account, password: e.target.value })}
                      autoComplete="new-password"
                      className={`${inputCls} pr-11`}
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
              </div>
            )}

            {/* PRO — ÉTAPE 1 : Profil pro */}
            {type === "professionnel" && step === 1 && (
              <div>
                <h1 className="font-display text-xl font-semibold tracking-tight text-plum">
                  Votre profil professionnel
                </h1>
                <p className="mt-1 text-sm text-slate">
                  Les familles vous trouveront grâce à ces infos.
                </p>
                <div className="mt-4 space-y-3">
                  <input
                    placeholder="Nom de l'entreprise"
                    value={pro.company}
                    onChange={(e) => setPro({ ...pro, company: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    placeholder="Catégorie (ex. Photographe, Traiteur…)"
                    value={pro.category}
                    onChange={(e) => setPro({ ...pro, category: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    placeholder="Ville / zone desservie"
                    value={pro.city}
                    onChange={(e) => setPro({ ...pro, city: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-2.5 flex items-center justify-between">
              {step > 0 ? (
                <button
                  onClick={back}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate hover:text-plum"
                >
                  <ArrowLeft size={16} />
                  Retour
                </button>
              ) : (
                <span />
              )}

              {step < last ? (
                <button
                  onClick={next}
                  disabled={!canSubmit}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-50"
                >
                  Continuer
                </button>
              ) : (
                <button
                  onClick={finish}
                  disabled={loading || !canSubmit}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-2 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
                >
                  <PartyPopper size={17} />
                  {loading
                    ? "Création…"
                    : type === "particulier"
                    ? "Créer mon compte"
                    : "Créer mon profil"}
                </button>
              )}
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-festif-soft px-4 py-3 text-sm text-festif">
                {error}
              </p>
            )}
          </div>

          <p className="mt-3 text-center text-sm text-slate">
            Déjà un compte ?{" "}
            <a href="/auth" className="font-semibold text-violet">
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
