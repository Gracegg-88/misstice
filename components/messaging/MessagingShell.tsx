"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import ConversationList from "./ConversationList";
import type { ConversationListItem } from "@/lib/messaging-types";

/**
 * Messagerie façon app : liste à gauche + conversation à droite (desktop).
 * Sur mobile : la liste OU la conversation. Échap ferme la conversation.
 */
export default function MessagingShell({
  conversations,
  basePath,
  emptyText,
  children,
}: {
  conversations: ConversationListItem[];
  basePath: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const activeId = path.startsWith(`${basePath}/`)
    ? path.slice(basePath.length + 1)
    : null;
  const hasActive = !!activeId;

  // Échap → sort de la conversation ouverte (revient à la liste).
  useEffect(() => {
    if (!hasActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(basePath);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasActive, basePath, router]);

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl gap-4">
      {/* Liste — masquée sur mobile quand une conversation est ouverte */}
      <div
        className={`min-h-0 w-full lg:w-80 lg:shrink-0 ${
          hasActive ? "hidden lg:block" : "block"
        }`}
      >
        <ConversationList
          conversations={conversations}
          basePath={basePath}
          activeId={activeId}
          emptyText={emptyText}
        />
      </div>

      {/* Panneau de droite — conversation ou état vide (CTA) */}
      <div
        className={`min-w-0 flex-1 ${hasActive ? "block" : "hidden lg:block"}`}
      >
        {children}
      </div>
    </div>
  );
}
