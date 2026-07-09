"use client";

import { usePathname } from "next/navigation";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { PRO_NAV as NAV } from "./nav";

export default function ProSidebar({
  name,
  category,
  city,
  verified,
  image,
  publicHref,
}: {
  name: string;
  category: string | null;
  city: string | null;
  verified: boolean;
  image: string | null;
  publicHref: string;
}) {
  const path = usePathname();
  const initial = (name.trim()[0] || "P").toUpperCase();
  const sub = [category, city].filter(Boolean).join(" · ");

  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-hidden border-r border-black/5 bg-white lg:flex">
      <div className="flex flex-1 flex-col p-3">
        {/* Carte pro */}
        <div className="rounded-2xl bg-cream p-3">
          <div className="flex items-center gap-3">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                className="h-10 w-10 shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet to-festif font-display text-base font-semibold text-white">
                {initial}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-plum">
                {name}
              </p>
              <p className="truncate text-xs text-slate">{sub || "Prestataire"}</p>
            </div>
          </div>
          {verified && (
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-violet-soft px-2.5 py-1 text-xs font-semibold text-violet">
              <BadgeCheck size={13} />
              Vérifié par Misstice
            </span>
          )}
        </div>

        {/* Navigation — items compacts, groupés en haut (comme le particulier) */}
        <nav className="mt-3 flex flex-col gap-1">
          {NAV.map((item) => {
            const active =
              item.href === "/pro" ? path === "/pro" : path.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-violet text-white"
                    : "text-slate hover:bg-violet-soft hover:text-violet"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Carte « Voir mon profil public » — poussée en bas (comme le particulier) */}
        <div className="relative mt-auto flex h-20 shrink-0 items-end overflow-hidden rounded-2xl ring-1 ring-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sidebar_particulier.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <a
            href={publicHref}
            className="relative z-10 flex w-full items-center justify-center gap-2 rounded-t-2xl bg-violet px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
          >
            <ExternalLink size={15} />
            Voir mon profil public
          </a>
        </div>
      </div>
    </aside>
  );
}
