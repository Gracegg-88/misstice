"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import PhoneVerification from "@/components/PhoneVerification";

/**
 * Filet de sécurité pour les prestataires arrivés sans passer par le
 * stepper d'inscription (ex. via Google) — voir app/pro/layout.tsx qui
 * redirige ici tant que profiles.phone_verified_at est vide.
 */
export default function VerifierTelephonePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/auth?next=/verifier-telephone");
        return;
      }
      setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <div className="flex h-[100dvh] flex-col bg-cream">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-slate">Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-cream bg-cover bg-center bg-no-repeat bg-[url('/background_signup_mobile.png')] sm:bg-[url('/background_login.png')]">
      <Header />
      <div className="flex flex-1 items-center justify-center overflow-hidden px-5 py-2">
        <div className="ev-fade-in w-full max-w-sm rounded-3xl border border-black/5 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
          <PhoneVerification onVerified={() => router.push("/pro")} />
        </div>
      </div>
    </div>
  );
}
