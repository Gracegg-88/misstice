"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UsersRound, Check } from "lucide-react";
import Logo from "@/components/Logo";

type Info = {
  event_name: string;
  member_email: string;
  member_role: string | null;
  claimed: boolean;
};

export default function InvitationPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  const router = useRouter();
  const [state, setState] = useState<
    "loading" | "ready" | "invalid" | "done"
  >("loading");
  const [info, setInfo] = useState<Info | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/auth?next=/invitation/${id}`);
        return;
      }
      const { data } = await supabase.rpc("invitation_info", {
        p_member_id: id,
      });
      const row = (Array.isArray(data) ? data[0] : data) as Info | undefined;
      if (!row) {
        setState("invalid");
        return;
      }
      setInfo(row);
      setState("ready");
    })();
  }, [id, router]);

  const accept = async () => {
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("accept_invitation", {
      p_member_id: id,
    });
    setBusy(false);
    if (error || !data) {
      setState("invalid");
      return;
    }
    document.cookie = `current_event_id=${data}; path=/; max-age=31536000; samesite=lax`;
    setState("done");
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1200);
  };

  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden bg-cream bg-cover bg-center"
      style={{ backgroundImage: "url('/background_login.png')" }}
    >
      <div className="absolute left-5 top-5 sm:left-8 sm:top-6">
        <a href="/" aria-label="Accueil">
          <Logo />
        </a>
      </div>

      <div className="flex flex-1 items-center justify-center px-5">
        <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white/95 p-7 text-center shadow-xl backdrop-blur-sm sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-soft text-violet">
            <UsersRound size={24} />
          </div>

          {state === "loading" && (
            <p className="mt-5 text-sm text-slate">Chargement de l&apos;invitation…</p>
          )}

          {state === "invalid" && (
            <>
              <h1 className="mt-4 font-display text-2xl font-semibold text-plum">
                Invitation invalide
              </h1>
              <p className="mt-2 text-sm text-slate">
                Ce lien n&apos;est plus valide ou a déjà été utilisé.
              </p>
              <a
                href="/dashboard"
                className="mt-6 inline-block rounded-xl bg-violet px-6 py-3 text-sm font-semibold text-white hover:bg-violet-dark"
              >
                Aller au tableau de bord
              </a>
            </>
          )}

          {state === "ready" && info && (
            <>
              <h1 className="mt-4 font-display text-2xl font-semibold text-plum">
                Rejoindre « {info.event_name} »
              </h1>
              <p className="mt-2 text-sm text-slate">
                Vous êtes invité·e à collaborer sur cet événement
                {info.member_role ? ` en tant que ${info.member_role}` : ""}.
              </p>
              <button
                type="button"
                onClick={accept}
                disabled={busy}
                className="mt-6 w-full rounded-xl bg-violet py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
              >
                {busy ? "…" : "Rejoindre l'événement"}
              </button>
            </>
          )}

          {state === "done" && (
            <>
              <div className="mx-auto mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald text-white">
                <Check size={20} />
              </div>
              <p className="mt-3 text-sm font-medium text-plum">
                C&apos;est fait ! Redirection vers le tableau de bord…
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
