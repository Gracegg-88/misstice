"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  Wallet,
  Users,
  Images,
  CalendarClock,
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

const PERKS = [
  { icon: Wallet, label: "Budget & checklist toujours à jour" },
  { icon: Users, label: "Invités & équipe qui collaborent" },
  { icon: Images, label: "Moodboard d'inspiration (Pinterest, TikTok, vos photos)" },
  { icon: CalendarClock, label: "Agenda pour vos appels prestataires" },
];

export default function AuthPage() {
  const router = useRouter();
  const [role, setRole] = useState<"particulier" | "prestataire">("particulier");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const go = () => {
    setLoading(true);
    // Remplacé plus tard par NextAuth (signIn). Pour l'instant on redirige.
    setTimeout(() => router.push("/dashboard"), 400);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Colonne formulaire (esprit Notion : calme et clair) ── */}
      <div className="flex flex-col bg-cream px-5 py-8 sm:px-10">
        <a href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet text-white">
            <Sparkles size={17} />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Misstice
          </span>
        </a>

        <div className="flex flex-1 items-center justify-center">
          <div className="ev-fade-in w-full max-w-sm py-10">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
              Accédez à votre événement
            </h1>
            <p className="mt-2 text-slate">
              Retrouvez votre budget, vos invités et votre équipe, là où vous
              les avez laissés.
            </p>

            {/* Sélecteur de profil */}
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-white p-1">
              {(["particulier", "prestataire"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-xl py-2 text-sm font-semibold capitalize transition-colors ${
                    role === r
                      ? "bg-violet text-white"
                      : "text-slate hover:text-plum"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {role === "prestataire" ? (
              <div className="mt-6 rounded-2xl border border-black/5 bg-white p-5 text-sm text-slate">
                Vous êtes un professionnel ? Votre espace pro (devis, demandes,
                agenda) se trouve ici.
                <a
                  href="/pro"
                  className="mt-3 block rounded-xl bg-violet px-4 py-2.5 text-center font-semibold text-white hover:bg-violet-dark"
                >
                  Accéder à l&apos;espace pro
                </a>
              </div>
            ) : (
              <>
                <button
                  onClick={go}
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white py-3 text-sm font-semibold text-plum transition-colors hover:bg-cream"
                >
                  <GoogleIcon />
                  Continuer avec Google
                </button>

                <div className="my-5 flex items-center gap-3 text-xs text-slate">
                  <span className="h-px flex-1 bg-black/10" />
                  ou avec votre email
                  <span className="h-px flex-1 bg-black/10" />
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    go();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium text-plum">
                      Email
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="vous@email.com"
                      className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-plum outline-none focus:border-violet"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-plum">
                        Mot de passe
                      </label>
                      <a href="#" className="text-xs font-medium text-violet">
                        Oublié ?
                      </a>
                    </div>
                    <div className="relative mt-1.5">
                      <input
                        required
                        type={showPwd ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 pr-11 text-sm text-plum outline-none focus:border-violet"
                      />
                      <button
                        type="button"
                        aria-label={
                          showPwd
                            ? "Masquer le mot de passe"
                            : "Afficher le mot de passe"
                        }
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-plum"
                      >
                        {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-violet py-3.5 text-base font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-70"
                  >
                    {loading ? "Connexion…" : "Se connecter"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate">
                  Pas encore de compte ?{" "}
                  <a href="/creer" className="font-semibold text-violet">
                    Créer un compte
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Colonne visuelle (esprit Canva : chaleureux et visuel) ── */}
      <div className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 50% at 75% 15%, rgba(255,140,66,0.22), transparent 60%)," +
              "radial-gradient(55% 55% at 15% 85%, rgba(108,60,225,0.4), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-md px-10 text-white">
          <h2 className="font-display text-4xl font-semibold leading-tight">
            Tout votre événement,
            <br />
            au même endroit.
          </h2>
          <p className="mt-4 text-white/70">
            La rigueur d&apos;un Notion, la créativité d&apos;un Canva — pensés
            pour les fêtes de famille.
          </p>

          {/* Aperçu flottant du tableau de bord */}
          <div className="mt-10 rounded-3xl bg-white/95 p-5 text-plum shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate">
                  Événement en cours
                </p>
                <p className="font-display text-lg font-semibold">
                  Mariage de Sophie &amp; Marc
                </p>
              </div>
              <span className="rounded-full bg-emerald-soft px-3 py-1 text-xs font-semibold text-emerald">
                J-93
              </span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs">
                <span className="font-medium">Progression globale</span>
                <span className="text-slate">54%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-violet-soft">
                <div className="h-full w-[54%] rounded-full bg-gradient-to-r from-violet to-emerald" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { v: "8 750€", l: "Budget" },
                { v: "129", l: "Invités" },
                { v: "3", l: "Prestataires" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-cream py-2">
                  <p className="font-display text-base font-semibold">{s.v}</p>
                  <p className="text-[11px] text-slate">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <ul className="mt-8 space-y-3">
            {PERKS.map((p) => (
              <li key={p.label} className="flex items-center gap-3 text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <p.icon size={16} />
                </span>
                {p.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
