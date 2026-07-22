"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import CategorySelect from "@/components/pro/CategorySelect";
import { safeNext } from "@/lib/safe-next";
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

const codeInputCls =
  "w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-center text-lg tracking-[0.5em] text-plum outline-none focus:border-violet";

// Numéro nettoyé pour Supabase Auth (format international attendu, ex. +33612345678).
const toE164 = (raw: string) => raw.trim().replace(/[\s().-]/g, "");

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
    const n = safeNext(sp.get("next"), "");
    if (n) setNextParam(n);
  }, []);

  // données
  const [account, setAccount] = useState({ name: "", email: "", password: "" });
  const [pro, setPro] = useState({ company: "", category: "", city: "" });
  const [consent, setConsent] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Vérification email (OTP à 6 chiffres, envoyé par Supabase Auth au signUp).
  const [emailCode, setEmailCode] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  // Vérification téléphone (OTP par SMS, en deux temps : saisie du numéro
  // puis saisie du code reçu).
  const [phonePhase, setPhonePhase] = useState<"number" | "code">("number");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [sendingPhone, setSendingPhone] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(0);

  // Liste des catégories existantes (lecture publique) pour le menu déroulant.
  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      // On n'affiche que les catégories actives. Repli si la colonne `active`
      // n'a pas encore été migrée (ancienne base) → on prend toutes les lignes.
      let { data, error: err } = await supabase
        .from("vendor_categories")
        .select("name")
        .eq("active", true)
        .order("name", { ascending: true });
      if (err) {
        ({ data } = await supabase
          .from("vendor_categories")
          .select("name")
          .order("name", { ascending: true }));
      }
      if (data) setCategories((data as { name: string }[]).map((c) => c.name));
    };
    void load();
  }, []);

  // Décompte des boutons « Renvoyer le code » (30s, un seul tick à la fois).
  useEffect(() => {
    if (emailCooldown <= 0) return;
    const id = setTimeout(() => setEmailCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [emailCooldown]);
  useEffect(() => {
    if (phoneCooldown <= 0) return;
    const id = setTimeout(() => setPhoneCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [phoneCooldown]);

  // Le particulier ne crée qu'un compte puis vérifie son email — la
  // confiance étant moins critique côté BtoC, pas de vérification
  // téléphone à ce stade. Le prestataire renseigne en plus sa fiche et
  // vérifie aussi son téléphone (cohérent avec la vérification SIRET à venir).
  const steps =
    type === "particulier"
      ? ["Compte", "Vérifier l'email"]
      : ["Compte", "Profil pro", "Vérifier l'email", "Vérifier le téléphone"];
  // Dernière étape de saisie (avant les vérifications OTP) : 0 pour un
  // particulier, 1 pour un prestataire (après « Profil pro »).
  const dataLast = type === "professionnel" ? 1 : 0;
  const emailStepIndex = dataLast + 1;
  const phoneStepIndex = dataLast + 2;
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

  // Redirection finale, une fois email ET téléphone vérifiés.
  const completeSignup = () => {
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
      setError(
        e instanceof Error ? e.message : "Une erreur est survenue pendant la création."
      );
    }
  };

  const finish = async () => {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const role = type === "professionnel" ? "prestataire" : "particulier";

    // Après confirmation d'email, on renvoie vers la destination voulue
    // (ex. la page d'invitation) via /auth/callback qui gère le `next`.
    const emailRedirectTo = `${window.location.origin}/auth/callback${
      nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""
    }`;

    // 1. Création du compte (le profil est créé automatiquement par un trigger).
    const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
      email: account.email.trim(),
      password: account.password,
      options: {
        emailRedirectTo,
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

    setLoading(false);

    if (signUpErr) {
      setError(
        signUpErr.message.includes("registered")
          ? "Un compte existe déjà avec cet email. Connectez-vous."
          : signUpErr.message
      );
      return;
    }

    // Si la confirmation email est désactivée côté projet, une session est
    // déjà ouverte : on passe directement à la suite (téléphone pour un
    // prestataire, sinon c'est terminé).
    if (signUp.session) {
      if (type === "professionnel") {
        setStep(phoneStepIndex);
      } else {
        completeSignup();
      }
      return;
    }

    // Cas normal : Supabase vient d'envoyer le code à 6 chiffres par email.
    setEmailCooldown(30);
    setStep(emailStepIndex);
  };

  const verifyEmail = async () => {
    if (emailCode.trim().length !== 6 || verifyingEmail) return;
    setError("");
    setVerifyingEmail(true);
    const supabase = createClient();
    const { error: vErr } = await supabase.auth.verifyOtp({
      email: account.email.trim(),
      token: emailCode.trim(),
      type: "signup",
    });
    setVerifyingEmail(false);
    if (vErr) {
      setError(
        /expired|invalid/i.test(vErr.message)
          ? "Code invalide ou expiré. Vérifiez le code ou demandez-en un nouveau."
          : vErr.message
      );
      return;
    }
    setEmailCode("");
    // Téléphone vérifié uniquement côté prestataire ; un particulier a fini.
    if (type === "professionnel") {
      setStep(phoneStepIndex);
    } else {
      completeSignup();
    }
  };

  const resendEmail = async () => {
    if (emailCooldown > 0) return;
    setError("");
    const supabase = createClient();
    const { error: rErr } = await supabase.auth.resend({
      type: "signup",
      email: account.email.trim(),
    });
    if (rErr) {
      setError(rErr.message);
      return;
    }
    setEmailCooldown(30);
  };

  const sendPhoneCode = async () => {
    const trimmed = toE164(phone);
    if (!trimmed || sendingPhone) return;
    setError("");
    setSendingPhone(true);
    const supabase = createClient();
    // Rattache et vérifie ce numéro pour le compte déjà authentifié (envoie
    // le SMS via le Send SMS Hook Supabase → Brevo).
    const { error: pErr } = await supabase.auth.updateUser({ phone: trimmed });
    setSendingPhone(false);
    if (pErr) {
      setError(pErr.message);
      return;
    }
    setPhonePhase("code");
    setPhoneCooldown(30);
  };

  const verifyPhone = async () => {
    if (phoneCode.trim().length !== 6 || verifyingPhone) return;
    setError("");
    setVerifyingPhone(true);
    const supabase = createClient();
    const { error: vErr } = await supabase.auth.verifyOtp({
      phone: toE164(phone),
      token: phoneCode.trim(),
      type: "phone_change",
    });
    if (vErr) {
      setVerifyingPhone(false);
      setError(
        /expired|invalid/i.test(vErr.message)
          ? "Code invalide ou expiré. Vérifiez le code ou demandez-en un nouveau."
          : vErr.message
      );
      return;
    }
    // Miroir dans profiles.phone pour affichage (dashboard, messagerie…).
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ phone: toE164(phone) }).eq("id", user.id);
    }
    setVerifyingPhone(false);
    completeSignup();
  };

  const resendPhone = async () => {
    if (phoneCooldown > 0) return;
    setError("");
    const supabase = createClient();
    const { error: rErr } = await supabase.auth.resend({
      type: "phone_change",
      phone: toE164(phone),
    });
    if (rErr) {
      setError(rErr.message);
      return;
    }
    setPhoneCooldown(30);
  };

  // validation minimale pour activer "Continuer / Créer"
  const canSubmit =
    (step === 0
      ? account.email.trim() !== "" && account.password.trim() !== ""
      : pro.company.trim() !== "" && pro.category.trim() !== "") && consent;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-cream bg-cover bg-center bg-no-repeat bg-[url('/background_signup_mobile.png')] sm:bg-[url('/background_login.png')]">
      <Header />

      <div className="flex flex-1 items-center justify-center overflow-hidden px-5 py-2">
        <div className="ev-fade-in w-full max-w-sm rounded-3xl border border-black/5 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
          {/* Stepper */}
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

                <label className="mt-3 flex items-start gap-2 text-sm text-slate">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 accent-violet"
                  />
                  <span>
                    J&apos;accepte les{" "}
                    <a href="/cgu" className="font-semibold text-violet hover:text-violet-dark">
                      Conditions Générales d&apos;Utilisation
                    </a>{" "}
                    et la{" "}
                    <a
                      href="https://www.iubenda.com/privacy-policy/93417670"
                      className="font-semibold text-violet hover:text-violet-dark"
                    >
                      Politique de confidentialité
                    </a>
                  </span>
                </label>
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
                  <CategorySelect
                    value={pro.category}
                    onChange={(v) => setPro({ ...pro, category: v })}
                    options={categories}
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

            {/* ÉTAPE — Vérifier l'email */}
            {step === emailStepIndex && (
              <div>
                <h1 className="font-display text-xl font-semibold tracking-tight text-plum">
                  Vérifiez votre email
                </h1>
                <p className="mt-1 text-sm text-slate">
                  Nous avons envoyé un code à 6 chiffres à{" "}
                  <span className="font-semibold text-plum">{account.email}</span>.
                </p>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className={`mt-4 ${codeInputCls}`}
                />
                <button
                  onClick={verifyEmail}
                  disabled={verifyingEmail || emailCode.trim().length !== 6}
                  className="mt-4 w-full rounded-xl bg-violet py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-50"
                >
                  {verifyingEmail ? "Vérification…" : "Vérifier le code"}
                </button>
                <button
                  type="button"
                  onClick={resendEmail}
                  disabled={emailCooldown > 0}
                  className="mt-2 w-full text-center text-sm font-medium text-violet hover:text-violet-dark disabled:text-slate"
                >
                  {emailCooldown > 0
                    ? `Renvoyer le code (${emailCooldown}s)`
                    : "Renvoyer le code"}
                </button>
              </div>
            )}

            {/* ÉTAPE — Vérifier le téléphone */}
            {step === phoneStepIndex && (
              <div>
                {phonePhase === "number" ? (
                  <>
                    <h1 className="font-display text-xl font-semibold tracking-tight text-plum">
                      Vérifiez votre téléphone
                    </h1>
                    <p className="mt-1 text-sm text-slate">
                      Un code par SMS confirmera votre numéro.
                    </p>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      className={`mt-4 ${inputCls}`}
                    />
                    <button
                      onClick={sendPhoneCode}
                      disabled={sendingPhone || !toE164(phone)}
                      className="mt-4 w-full rounded-xl bg-violet py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-50"
                    >
                      {sendingPhone ? "Envoi…" : "Recevoir le code"}
                    </button>
                  </>
                ) : (
                  <>
                    <h1 className="font-display text-xl font-semibold tracking-tight text-plum">
                      Entrez le code reçu
                    </h1>
                    <p className="mt-1 text-sm text-slate">
                      Code envoyé au{" "}
                      <span className="font-semibold text-plum">{phone}</span>.
                    </p>
                    <input
                      inputMode="numeric"
                      maxLength={6}
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className={`mt-4 ${codeInputCls}`}
                    />
                    <button
                      onClick={verifyPhone}
                      disabled={verifyingPhone || phoneCode.trim().length !== 6}
                      className="mt-4 w-full rounded-xl bg-violet py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-50"
                    >
                      {verifyingPhone ? "Vérification…" : "Vérifier le code"}
                    </button>
                    <button
                      type="button"
                      onClick={resendPhone}
                      disabled={phoneCooldown > 0}
                      className="mt-2 w-full text-center text-sm font-medium text-violet hover:text-violet-dark disabled:text-slate"
                    >
                      {phoneCooldown > 0
                        ? `Renvoyer le code (${phoneCooldown}s)`
                        : "Renvoyer le code"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhonePhase("number");
                        setPhoneCode("");
                        setError("");
                      }}
                      className="mt-3 block w-full text-center text-xs text-slate hover:text-plum"
                    >
                      Modifier le numéro
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Navigation (masquée pendant les étapes de vérification OTP,
                qui ont leurs propres boutons dédiés) */}
            {step <= dataLast && (
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

                {step < dataLast ? (
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
            )}

            {error && (
              <p className="mt-4 rounded-xl bg-festif-soft px-4 py-3 text-sm text-festif">
                {error}
              </p>
            )}
          </div>

          {step <= dataLast && (
            <p className="mt-3 text-center text-sm text-slate">
              Déjà un compte ?{" "}
              <a href="/auth" className="font-semibold text-violet">
                Se connecter
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
