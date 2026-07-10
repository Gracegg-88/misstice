"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Send,
  FileText,
  ArrowRight,
  ArrowLeft,
  Plus,
  Camera,
  Images,
  Loader2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import type { Message } from "@/lib/messaging-types";

// Marqueurs techniques dans le corps d'un message.
const DEVIS_RE = /^\[\[devis:([0-9a-f-]+)\]\]\s*([\s\S]*)$/i;
const IMG_RE = /^\[\[img:(.+?)\]\]$/i;
const VID_RE = /^\[\[vid:(.+?)\]\]$/i;
const DOC_RE = /^\[\[doc:(.+?)\|([\s\S]*?)\]\]$/i;

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === y.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function ConversationThread({
  conversationId,
  userId,
  otherName,
  otherAvatar = null,
  otherHref = null,
  quoteAction = null,
  initial,
  basePath,
  otherLastReadAt = null,
}: {
  conversationId: string;
  userId: string;
  otherName: string;
  otherAvatar?: string | null;
  // Lien vers la fiche publique du prestataire (côté particulier uniquement).
  otherHref?: string | null;
  // Action devis dans le menu « + » : « Rédiger un devis » (pro) ou
  // « Demander un devis » (client).
  quoteAction?: { label: string; href: string } | null;
  initial: Message[];
  basePath?: string;
  // Dernière lecture de l'autre partie → accusé « Vu » sur mes messages.
  otherLastReadAt?: string | null;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initial);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sendError, setSendError] = useState("");
  // Pièce jointe EN ATTENTE : aperçu dans la barre, envoyée au clic sur Envoyer.
  const [pending, setPending] = useState<{
    file: File;
    url: string;
    asDoc: boolean;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Inputs DÉDIÉS (attributs fixes) : plus fiable sur mobile que muter `capture`.
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m]
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // À l'ouverture : marque lu PUIS rafraîchit les compteurs serveur
  // (badge sidebar + liste) pour qu'ils disparaissent immédiatement.
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    void supabase
      .rpc("mark_conversation_read", { p_conv: conversationId })
      .then(() => {
        if (active) router.refresh();
      });
    return () => {
      active = false;
    };
  }, [conversationId, router]);

  // Nouveau message reçu pendant qu'on lit → on garde le fil marqué comme lu.
  useEffect(() => {
    const supabase = createClient();
    void supabase.rpc("mark_conversation_read", { p_conv: conversationId });
  }, [conversationId, messages.length]);

  // Insère un message (texte ou marqueur) et l'ajoute localement.
  const pushMessage = async (text: string): Promise<boolean> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: userId, body: text })
      .select("id, conversation_id, sender_id, body, created_at")
      .single();
    if (error || !data) return false;
    setMessages((prev) =>
      prev.some((x) => x.id === (data as Message).id)
        ? prev
        : [...prev, data as Message]
    );
    return true;
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if ((!text && !pending) || sending) return;
    setSending(true);
    setSendError("");
    // 1) Pièce jointe en attente (le cas échéant).
    if (pending) {
      const okFile = await sendPending();
      if (!okFile) {
        setSending(false);
        return;
      }
    }
    // 2) Texte éventuel.
    if (text) {
      const ok = await pushMessage(text);
      if (!ok) {
        setSending(false);
        setSendError("Message non envoyé. Réessayez.");
        return;
      }
      setBody("");
    }
    setSending(false);
  };

  // Ouvre l'input dédié correspondant (menu « + »).
  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    setMenuOpen(false);
    if (ref.current) {
      ref.current.value = "";
      ref.current.click();
    }
  };

  // Sélection d'un fichier : on le MET EN ATTENTE (aperçu), sans envoyer.
  const onAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    // Fichier venu du bouton « Document » → envoyé en pièce jointe même si image.
    const asDoc = input === docRef.current;
    const isVideo = file.type.startsWith("video/");
    const maxMo = isVideo ? 50 : 15;
    if (file.size > maxMo * 1024 * 1024) {
      setSendError(`Fichier trop lourd (max ${maxMo} Mo).`);
      return;
    }
    setSendError("");
    if (pending) URL.revokeObjectURL(pending.url);
    setPending({ file, url: URL.createObjectURL(file), asDoc });
  };

  const clearPending = () => {
    if (pending) URL.revokeObjectURL(pending.url);
    setPending(null);
  };

  // Envoie la pièce jointe en attente (upload → marqueur).
  const sendPending = async (): Promise<boolean> => {
    if (!pending) return true;
    const { file, asDoc } = pending;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    try {
      const up = await uploadToCloudinary(file);
      const marker = asDoc
        ? `[[doc:${up.url}|${file.name}]]`
        : isImage
          ? `[[img:${up.url}]]`
          : isVideo
            ? `[[vid:${up.url}]]`
            : `[[doc:${up.url}|${file.name}]]`;
      const ok = await pushMessage(marker);
      if (ok) clearPending();
      return ok;
    } catch {
      setSendError("Envoi du fichier échoué.");
      return false;
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Index du DERNIER de mes messages déjà lu par l'autre → « Vu » dessous.
  const readTs = otherLastReadAt ? new Date(otherLastReadAt).getTime() : 0;
  let seenIdx = -1;
  if (readTs > 0) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.sender_id === userId && new Date(m.created_at).getTime() <= readTs) {
        seenIdx = i;
        break;
      }
    }
  }

  return (
    <div className="flex h-full flex-col rounded-3xl border border-black/5 bg-white">
      <div className="flex items-center gap-3 border-b border-black/5 px-5 py-4">
        {basePath && (
          <Link
            href={basePath}
            aria-label="Retour aux conversations"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate hover:bg-cream lg:hidden"
          >
            <ArrowLeft size={18} />
          </Link>
        )}
        {(() => {
          const avatar = otherAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={otherAvatar}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet text-sm font-semibold text-white">
              {(otherName.trim()[0] || "?").toUpperCase()}
            </span>
          );
          // Côté particulier : cliquer sur l'avatar/nom ouvre la fiche publique.
          return otherHref ? (
            <Link
              href={otherHref}
              title="Voir la fiche publique"
              className="group flex min-w-0 items-center gap-3"
            >
              {avatar}
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-semibold text-plum group-hover:text-violet group-hover:underline">
                  {otherName}
                </p>
                <p className="truncate text-xs text-slate group-hover:text-violet">
                  Cliquez pour accéder au profil public de {otherName}
                </p>
              </div>
            </Link>
          ) : (
            <>
              {avatar}
              <p className="truncate font-display text-lg font-semibold text-plum">
                {otherName}
              </p>
            </>
          );
        })()}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-slate">
            Aucun message pour l&apos;instant.
          </p>
        )}
        {messages.map((m, idx) => {
          const mine = m.sender_id === userId;
          const prev = messages[idx - 1];
          const showSep =
            !prev ||
            new Date(prev.created_at).toDateString() !==
              new Date(m.created_at).toDateString();

          const devis = m.body.match(DEVIS_RE);
          const img = m.body.match(IMG_RE);
          const vid = m.body.match(VID_RE);
          const doc = m.body.match(DOC_RE);

          return (
            <Fragment key={m.id}>
              {showSep && (
                <div className="flex justify-center py-1">
                  <span className="rounded-full bg-cream px-3 py-1 text-[11px] font-medium text-slate">
                    {dayLabel(m.created_at)}
                  </span>
                </div>
              )}

              {devis ? (
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <Link
                    href={`/devis/${devis[1]}`}
                    className="max-w-[80%] rounded-2xl border border-violet/20 bg-white p-4 shadow-sm transition-colors hover:border-violet"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-violet">
                        <FileText size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-sm font-semibold text-plum">
                          {devis[2].trim() || "Devis"}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-violet">
                          Voir le devis <ArrowRight size={12} />
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-slate">{fmt(m.created_at)}</p>
                  </Link>
                </div>
              ) : img ? (
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <a
                    href={img[1]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="max-w-[70%] overflow-hidden rounded-2xl border border-black/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img[1]}
                      alt="Image partagée"
                      referrerPolicy="no-referrer"
                      className="max-h-72 w-full object-cover"
                    />
                    <p className="bg-white px-3 py-1 text-[11px] text-slate">
                      {fmt(m.created_at)}
                    </p>
                  </a>
                </div>
              ) : vid ? (
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[70%] overflow-hidden rounded-2xl border border-black/5 bg-black">
                    <video
                      src={vid[1]}
                      controls
                      playsInline
                      className="max-h-72 w-full object-contain"
                    />
                    <p className="bg-white px-3 py-1 text-[11px] text-slate">
                      {fmt(m.created_at)}
                    </p>
                  </div>
                </div>
              ) : doc ? (
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <a
                    href={doc[1]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex max-w-[75%] items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 transition-colors hover:border-violet"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-violet">
                      <FileText size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-plum">
                        {doc[2].trim() || "Document"}
                      </p>
                      <p className="text-[11px] text-slate">{fmt(m.created_at)}</p>
                    </div>
                  </a>
                </div>
              ) : (
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      mine ? "bg-violet text-white" : "bg-cream text-plum"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p
                      className={`mt-1 text-[11px] ${
                        mine ? "text-white/70" : "text-slate"
                      }`}
                    >
                      {fmt(m.created_at)}
                    </p>
                  </div>
                </div>
              )}

              {idx === seenIdx && (
                <p className="pr-1 text-right text-[11px] font-medium text-violet">
                  Vu
                </p>
              )}
            </Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <p className="border-t border-black/5 px-4 pt-2 text-xs font-medium text-festif">
          {sendError}
        </p>
      )}

      {/* Aperçu de la pièce jointe en attente (envoyée au clic sur Envoyer). */}
      {pending && (
        <div className="flex items-center gap-3 border-t border-black/5 px-3 pt-3">
          {pending.file.type.startsWith("image/") && !pending.asDoc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pending.url}
              alt=""
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-cream text-violet">
              <FileText size={22} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-plum">
              {pending.file.name}
            </p>
            <p className="text-xs text-slate">Prêt à envoyer</p>
          </div>
          <button
            type="button"
            onClick={clearPending}
            aria-label="Retirer la pièce jointe"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate hover:bg-cream hover:text-festif"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form
        onSubmit={send}
        className="flex items-end gap-2 border-t border-black/5 p-3"
      >
        {cloudinaryConfigured() && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              disabled={sending}
              aria-label="Joindre un fichier"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 text-slate hover:bg-cream disabled:opacity-50"
            >
              <Plus size={20} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute bottom-full left-0 z-50 mb-2 w-52 overflow-hidden rounded-2xl border border-black/5 bg-white p-1.5 shadow-lg">
                  {quoteAction && (
                    <Link
                      href={quoteAction.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-violet hover:bg-violet-soft"
                    >
                      <FileText size={18} />
                      {quoteAction.label}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => openPicker(galleryRef)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-plum hover:bg-cream"
                  >
                    <Images size={18} className="text-violet" />
                    Photos et vidéos
                  </button>
                  <button
                    type="button"
                    onClick={() => openPicker(cameraRef)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-plum hover:bg-cream"
                  >
                    <Camera size={18} className="text-festif" />
                    Caméra
                  </button>
                  <button
                    type="button"
                    onClick={() => openPicker(docRef)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-plum hover:bg-cream"
                  >
                    <FileText size={18} className="text-emerald" />
                    Document
                  </button>
                </div>
              </>
            )}

            {/* Inputs dédiés (attributs fixes). */}
            <input
              ref={galleryRef}
              type="file"
              accept="image/*,video/*"
              onChange={onAttach}
              className="hidden"
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onAttach}
              className="hidden"
            />
            <input
              ref={docRef}
              type="file"
              accept="application/pdf,image/*"
              onChange={onAttach}
              className="hidden"
            />
          </div>
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(e as unknown as React.FormEvent);
            }
          }}
          rows={1}
          placeholder="Écrire un message…"
          className="max-h-32 flex-1 resize-none rounded-2xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet"
        />
        <button
          type="submit"
          disabled={sending || (!body.trim() && !pending)}
          aria-label="Envoyer"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet text-white hover:bg-violet-dark disabled:opacity-50"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
