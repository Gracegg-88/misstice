"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let active = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;
      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, body, link, read, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (active) setItems((data as Notif[]) ?? []);

      channel = supabase
        .channel(`notif-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) =>
            setItems((prev) =>
              prev.some((x) => x.id === (payload.new as Notif).id)
                ? prev
                : [payload.new as Notif, ...prev].slice(0, 20)
            )
        )
        .subscribe();
    })();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const markAllRead = async () => {
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).in("id", ids);
  };

  const openNotif = async (n: Notif) => {
    setOpen(false);
    if (!n.read) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
      const supabase = createClient();
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    }
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-black/5 bg-white text-plum hover:border-black/10"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-festif px-1 text-[11px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
              <p className="font-display text-sm font-semibold text-plum">
                Notifications
              </p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-violet hover:text-violet-dark"
                >
                  <Check size={13} />
                  Tout lire
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate">
                  Aucune notification.
                </p>
              ) : (
                <ul className="divide-y divide-black/5">
                  {items.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openNotif(n)}
                        className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors hover:bg-cream ${
                          n.read ? "" : "bg-violet-soft/40"
                        }`}
                      >
                        <span className="flex w-full items-center gap-2">
                          {!n.read && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-violet" />
                          )}
                          <span className="text-sm font-semibold text-plum">
                            {n.title}
                          </span>
                          <span className="ml-auto text-[11px] text-slate">
                            {ago(n.created_at)}
                          </span>
                        </span>
                        {n.body && (
                          <span className="line-clamp-2 pl-4 text-xs text-slate">
                            {n.body}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
