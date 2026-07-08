"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminUserMenu({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const initial = (name.trim()[0] || "A").toUpperCase();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <div className="relative">
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-black/5 bg-white p-1.5 shadow-lg">
            <Link
              href="/admin/profil"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-plum hover:bg-cream"
            >
              <User size={16} className="text-slate" />
              Profil
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-plum hover:bg-cream"
            >
              <LogOut size={16} className="text-slate" />
              Se déconnecter
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-2xl p-1.5 transition-colors hover:bg-white/60"
      >
        <span className="relative shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet text-sm font-semibold text-white">
              {initial}
            </span>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald" />
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-sm font-semibold text-plum">
            {name || "Admin"}
          </span>
          <span className="block text-xs text-slate">Administrateur</span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}
