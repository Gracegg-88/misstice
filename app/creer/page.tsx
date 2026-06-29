"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Heart,
  Cake,
  Baby,
  GlassWater,
  Gift,
  Plus,
  X,
  Wallet,
  Users,
  CalendarDays,
  PartyPopper,
} from "lucide-react";

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

const EVENT_TYPES = [
  { label: "Mariage", icon: Heart },
  { label: "Anniversaire", icon: Cake },
  { label: "Baptême", icon: Baby },
  { label: "Gala / soirée", icon: GlassWater },
  { label: "Autre", icon: Gift },
];

const inputCls =
  "w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-sm text-plum outline-none focus:border-violet";

export default function CreerPage() {
  const router = useRouter();
  const [type, setType] = useState<"particulier" | "professionnel">("particulier");
  const [step, setStep] = useState(0);
  const [showPwd, setShowPwd] = useState(false);

  // données
  const [account, setAccount] = useState({ name: "", email: "", password: "" });
  const [event, setEvent] = useState({ type: "", name: "", date: "" });
  const [details, setDetails] = useState({ budget: "", guests: "" });
  const [collabs, setCollabs] = useState<{ email: string; role: string }[]>([]);
  const [collabEmail, setCollabEmail] = useState("");
  const [collabRole, setCollabRole] = useState("");
  const [pro, setPro] = useState({ company: "", category: "", city: "" });

  const stepsPart = ["Compte", "Événement", "Détails", "Équipe", "Résumé"];
  const stepsPro = ["Compte", "Profil pro", "Résumé"];
  const steps = type === "particulier" ? stepsPart : stepsPro;
  const last = steps.length - 1;

  const next = () => setStep((s) => Math.min(s + 1, last));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const addCollab = () => {
    if (!collabEmail.trim()) return;
    setCollabs((c) => [...c, { email: collabEmail, role: collabRole || "Collaborateur" }]);
    setCollabEmail("");
    setCollabRole("");
  };

  const finish = () => {
    // À remplacer par la vraie création (NextAuth + API). Ici on redirige.
    router.push(type === "professionnel" ? "/pro" : "/dashboard");
  };

  // validation minimale pour activer "Continuer"
  const canNext =
    step === 0
      ? account.email.trim() !== "" && account.password.trim() !== ""
      : type === "particulier" && step === 1
      ? event.type !== "" && event.name.trim() !== ""
      : type === "professionnel" && step === 1
      ? pro.company.trim() !== "" && pro.category.trim() !== ""
      : true;

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      {/* ── Colonne assistant ── */}
      <div className="flex flex-col bg-cream px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet text-white">
              <Sparkles size={17} />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">
              Misstice
            </span>
          </a>
          <a href="/auth" className="text-sm font-medium text-slate hover:text-plum">
            Déjà un compte ? Se connecter
          </a>
        </div>

        {/* Stepper */}
        <div className="mx-auto mt-8 flex w-full max-w-lg items-center">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    i < step
                      ? "bg-emerald text-white"
                      : i === step
                      ? "bg-violet text-white"
                      : "bg-white text-slate"
                  }`}
                >
                  {i < step ? <Check size={15} /> : i + 1}
                </span>
                <span className="mt-1 hidden text-[11px] text-slate sm:block">
                  {s}
                </span>
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

        <div className="flex flex-1 items-center justify-center">
          <div key={step} className="ev-fade-in w-full max-w-lg py-8">
            {/* ÉTAPE 0 — Compte */}
            {step === 0 && (
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
                  Créez votre compte
                </h1>
                <p className="mt-2 text-slate">
                  Gratuit. Vous ne payez que les prestataires que vous réservez.
                </p>

                {/* Type de compte */}
                <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-white p-1">
                  {(["particulier", "professionnel"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setType(t);
                        setStep(0);
                      }}
                      className={`rounded-xl py-2.5 text-sm font-semibold capitalize transition-colors ${
                        type === t ? "bg-violet text-white" : "text-slate hover:text-plum"
                      }`}
                    >
                      {t === "particulier" ? "J'organise" : "Je suis prestataire"}
                    </button>
                  ))}
                </div>

                <button
                  onClick={next}
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white py-3 text-sm font-semibold text-plum hover:bg-cream"
                >
                  <GoogleIcon />
                  Continuer avec Google
                </button>
                <div className="my-5 flex items-center gap-3 text-xs text-slate">
                  <span className="h-px flex-1 bg-black/10" />
                  ou avec votre email
                  <span className="h-px flex-1 bg-black/10" />
                </div>

                <div className="space-y-4">
                  <input
                    placeholder="Prénom et nom"
                    value={account.name}
                    onChange={(e) => setAccount({ ...account, name: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="email"
                    placeholder="vous@email.com"
                    value={account.email}
                    onChange={(e) => setAccount({ ...account, email: e.target.value })}
                    className={inputCls}
                  />
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      placeholder="Mot de passe"
                      value={account.password}
                      onChange={(e) => setAccount({ ...account, password: e.target.value })}
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

            {/* PARTICULIER — ÉTAPE 1 : Événement */}
            {type === "particulier" && step === 1 && (
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
                  Votre événement
                </h1>
                <p className="mt-2 text-slate">On commence par l&apos;essentiel.</p>

                <p className="mt-6 text-sm font-medium text-plum">
                  Quel type d&apos;événement ?
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {EVENT_TYPES.map((t) => {
                    const on = event.type === t.label;
                    return (
                      <button
                        key={t.label}
                        onClick={() => setEvent({ ...event, type: t.label })}
                        className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors ${
                          on
                            ? "border-violet bg-violet-soft text-violet"
                            : "border-black/10 bg-white text-slate hover:border-violet/40"
                        }`}
                      >
                        <t.icon size={22} />
                        <span className="text-sm font-medium">{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-plum">
                      Nom de l&apos;événement
                    </label>
                    <input
                      placeholder="ex. Mariage de Sophie & Marc"
                      value={event.name}
                      onChange={(e) => setEvent({ ...event, name: e.target.value })}
                      className={`mt-1.5 ${inputCls}`}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-plum">Date</label>
                    <input
                      type="date"
                      value={event.date}
                      onChange={(e) => setEvent({ ...event, date: e.target.value })}
                      className={`mt-1.5 ${inputCls}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PARTICULIER — ÉTAPE 2 : Détails */}
            {type === "particulier" && step === 2 && (
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
                  Budget &amp; invités
                </h1>
                <p className="mt-2 text-slate">
                  Des estimations, modifiables à tout moment.
                </p>

                <div className="mt-6">
                  <label className="text-sm font-medium text-plum">
                    Budget prévisionnel (€)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="ex. 15000"
                    value={details.budget}
                    onChange={(e) => setDetails({ ...details, budget: e.target.value })}
                    className={`mt-1.5 ${inputCls}`}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["5000", "10000", "20000", "30000"].map((b) => (
                      <button
                        key={b}
                        onClick={() => setDetails({ ...details, budget: b })}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate hover:text-plum"
                      >
                        {parseInt(b).toLocaleString("fr-FR")}€
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-sm font-medium text-plum">
                    Nombre d&apos;invités
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="ex. 120"
                    value={details.guests}
                    onChange={(e) => setDetails({ ...details, guests: e.target.value })}
                    className={`mt-1.5 ${inputCls}`}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["50", "100", "150", "200"].map((g) => (
                      <button
                        key={g}
                        onClick={() => setDetails({ ...details, guests: g })}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate hover:text-plum"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PARTICULIER — ÉTAPE 3 : Équipe */}
            {type === "particulier" && step === 3 && (
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
                  Invitez votre équipe
                </h1>
                <p className="mt-2 text-slate">
                  Partagez l&apos;organisation avec vos proches (facultatif).
                </p>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    placeholder="email@exemple.com"
                    value={collabEmail}
                    onChange={(e) => setCollabEmail(e.target.value)}
                    className={inputCls}
                  />
                  <input
                    placeholder="Rôle (ex. Traiteur)"
                    value={collabRole}
                    onChange={(e) => setCollabRole(e.target.value)}
                    className={`${inputCls} sm:w-44`}
                  />
                  <button
                    onClick={addCollab}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-violet px-4 py-3 text-sm font-semibold text-white hover:bg-violet-dark"
                  >
                    <Plus size={16} />
                    Ajouter
                  </button>
                </div>

                <ul className="mt-4 space-y-2">
                  {collabs.map((c, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-black/5 bg-white px-4 py-2.5 text-sm"
                    >
                      <span>
                        <span className="font-medium text-plum">{c.email}</span>{" "}
                        <span className="text-slate">· {c.role}</span>
                      </span>
                      <button
                        aria-label="Retirer"
                        onClick={() => setCollabs((l) => l.filter((_, j) => j !== i))}
                        className="text-slate hover:text-plum"
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                  {collabs.length === 0 && (
                    <li className="rounded-xl border border-dashed border-black/10 px-4 py-6 text-center text-sm text-slate">
                      Vous pourrez toujours inviter des proches plus tard.
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* PARTICULIER — ÉTAPE 4 : Résumé */}
            {type === "particulier" && step === 4 && (
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
                  Tout est prêt
                </h1>
                <p className="mt-2 text-slate">
                  Vérifiez, puis créez votre espace.
                </p>
                <div className="mt-6 space-y-3 rounded-2xl border border-black/5 bg-white p-5 text-sm">
                  <Row label="Compte" value={account.email || "—"} />
                  <Row label="Événement" value={event.name || "—"} />
                  <Row label="Type" value={event.type || "—"} />
                  <Row label="Date" value={event.date || "À définir"} />
                  <Row
                    label="Budget"
                    value={details.budget ? `${parseInt(details.budget).toLocaleString("fr-FR")}€` : "—"}
                  />
                  <Row label="Invités" value={details.guests || "—"} />
                  <Row label="Équipe" value={`${collabs.length} invité(s)`} />
                </div>
              </div>
            )}

            {/* PRO — ÉTAPE 1 : Profil pro */}
            {type === "professionnel" && step === 1 && (
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
                  Votre profil professionnel
                </h1>
                <p className="mt-2 text-slate">
                  Les familles vous trouveront grâce à ces infos.
                </p>
                <div className="mt-6 space-y-4">
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

            {/* PRO — ÉTAPE 2 : Résumé */}
            {type === "professionnel" && step === 2 && (
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
                  Profil prêt
                </h1>
                <p className="mt-2 text-slate">
                  Vous pourrez ajouter vos photos et tarifs ensuite.
                </p>
                <div className="mt-6 space-y-3 rounded-2xl border border-black/5 bg-white p-5 text-sm">
                  <Row label="Compte" value={account.email || "—"} />
                  <Row label="Entreprise" value={pro.company || "—"} />
                  <Row label="Catégorie" value={pro.category || "—"} />
                  <Row label="Zone" value={pro.city || "—"} />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              {step > 0 ? (
                <button
                  onClick={back}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate hover:text-plum"
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
                  disabled={!canNext}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-50"
                >
                  {type === "particulier" && step === 3 && collabs.length === 0
                    ? "Passer cette étape"
                    : "Continuer"}
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={finish}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white hover:bg-violet-dark"
                >
                  <PartyPopper size={17} />
                  {type === "particulier" ? "Créer mon événement" : "Créer mon profil"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Colonne récap (Canva) ── */}
      <div className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 50% at 80% 10%, rgba(255,140,66,0.2), transparent 60%)," +
              "radial-gradient(55% 55% at 10% 90%, rgba(108,60,225,0.4), transparent 60%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-sm px-10 text-white">
          <h2 className="font-display text-3xl font-semibold leading-tight">
            {type === "particulier"
              ? "Votre événement prend forme."
              : "Votre vitrine prend forme."}
          </h2>
          <div className="mt-8 rounded-3xl bg-white/95 p-5 text-plum shadow-2xl">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">
              {type === "particulier" ? "Aperçu de l'événement" : "Aperçu du profil"}
            </p>
            {type === "particulier" ? (
              <>
                <p className="mt-1 font-display text-xl font-semibold">
                  {event.name || "Votre événement"}
                </p>
                <div className="mt-4 space-y-2.5 text-sm">
                  <Mini icon={PartyPopper} label="Type" value={event.type || "—"} />
                  <Mini icon={CalendarDays} label="Date" value={event.date || "À définir"} />
                  <Mini
                    icon={Wallet}
                    label="Budget"
                    value={details.budget ? `${parseInt(details.budget).toLocaleString("fr-FR")}€` : "—"}
                  />
                  <Mini icon={Users} label="Invités" value={details.guests || "—"} />
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 font-display text-xl font-semibold">
                  {pro.company || "Votre entreprise"}
                </p>
                <div className="mt-4 space-y-2.5 text-sm">
                  <Mini icon={Sparkles} label="Catégorie" value={pro.category || "—"} />
                  <Mini icon={CalendarDays} label="Zone" value={pro.city || "—"} />
                </div>
              </>
            )}
          </div>
          <p className="mt-6 text-sm text-white/70">
            Étape {step + 1} sur {steps.length} — {steps[step]}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/5 pb-3 last:border-0 last:pb-0">
      <span className="text-slate">{label}</span>
      <span className="font-semibold text-plum">{value}</span>
    </div>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-slate">
        <Icon size={15} />
        {label}
      </span>
      <span className="font-medium text-plum">{value}</span>
    </div>
  );
}
