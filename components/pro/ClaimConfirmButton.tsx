"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ClaimConfirmButton({ vendorId, userId }: { vendorId: string; userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    setLoading(true);
    setError("");
    const { error: err } = await createClient()
      .from("vendor_claim_requests")
      .insert({ imported_vendor_id: vendorId, user_id: userId });
    setLoading(false);
    if (err) {
      setError("La demande n'a pas pu être envoyée. Réessayez plus tard.");
      return;
    }
    router.replace("/pro");
    router.refresh();
  };

  return (
    <div className="mt-4">
      <button
        onClick={send}
        disabled={loading}
        className="rounded-2xl bg-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
      >
        {loading ? "Envoi…" : "Envoyer ma demande de rattachement"}
      </button>
      {error && <p className="mt-2 text-sm text-garnet">{error}</p>}
    </div>
  );
}
