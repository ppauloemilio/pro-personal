"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import {
  markConversationReadAction,
  sendMessageAction,
  uploadFileAction,
} from "@/lib/actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Image as ImageIcon,
  Paperclip,
  Send,
  FileText,
  X,
  Download,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  content: string;
  type: string;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  sender: { id: string; name: string };
};

/* ─── Lightbox Modal ─── */
function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/* ─── File extension helper ─── */
function getFileExtension(fileName: string | null): string {
  if (!fileName) return "?";
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toUpperCase() : "?";
}

function isImageMimeType(url: string): boolean {
  return url.startsWith("data:image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp)/i.test(url);
}

/* ─── ChatPanel ─── */
export function ChatPanel({
  conversationId,
  messages: initial,
  currentUserId,
  readOnly = false,
}: {
  conversationId: string;
  messages: Message[];
  currentUserId: string;
  readOnly?: boolean;
}) {
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    markConversationReadAction(conversationId).catch(() => {});
  }, [conversationId]);

  const openLightbox = useCallback((src: string, alt: string) => {
    setLightboxSrc(src);
    setLightboxAlt(alt);
  }, []);

  function clearError() {
    setErrorMsg(null);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const msg = text.trim();
    if (!msg || sending || readOnly) return;
    setSending(true);
    setErrorMsg(null);
    try {
      const res = await sendMessageAction(conversationId, msg);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content: msg,
            type: "TEXT",
            fileUrl: null,
            fileName: null,
            createdAt: new Date().toISOString(),
            sender: { id: currentUserId, name: "Você" },
          },
        ]);
        setText("");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  }

  async function handleFile(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "IMAGE" | "FILE"
  ) {
    const file = e.target.files?.[0];
    if (!file || readOnly) return;

    // Reset input so same file can be re-selected
    e.target.value = "";

    setSending(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await uploadFileAction(fd);
      if (up.error) {
        setErrorMsg(up.error);
        return;
      }
      if (up.url) {
        const res = await sendMessageAction(
          conversationId,
          type === "IMAGE" ? "📷 Imagem" : `📎 ${up.fileName}`,
          type,
          up.url,
          up.fileName
        );
        if (res.error) {
          setErrorMsg(res.error);
          return;
        }
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content: type === "IMAGE" ? "Imagem enviada" : up.fileName || "Arquivo",
            type,
            fileUrl: up.url,
            fileName: up.fileName || null,
            createdAt: new Date().toISOString(),
            sender: { id: currentUserId, name: "Você" },
          },
        ]);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao enviar arquivo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-220px)] min-h-[400px] flex-col rounded-2xl border border-surface-border bg-surface-card/50">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => {
          const mine = m.sender.id === currentUserId;
          return (
            <div
              key={m.id}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  mine
                    ? "bg-brand-600 text-white"
                    : "bg-surface-elevated text-slate-200"
                )}
              >
                {!mine && (
                  <p className="mb-1 text-xs font-medium text-brand-300">
                    {m.sender.name}
                  </p>
                )}

                {/* IMAGE message — thumbnail + click to expand */}
                {m.type === "IMAGE" && m.fileUrl ? (
                  <button
                    type="button"
                    className="group block cursor-pointer rounded-lg transition hover:opacity-80"
                    onClick={() => openLightbox(m.fileUrl!, m.content)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.fileUrl}
                      alt={m.content}
                      className="max-h-48 max-w-full rounded-lg object-cover"
                    />
                    <span className="mt-1 block text-[11px] opacity-60 group-hover:opacity-100 transition">
                      🖼️ {m.fileName || "Imagem"} — Clique para ampliar
                    </span>
                  </button>
                ) : /* FILE message — file card with icon + download */
                m.fileUrl ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg bg-white/5 p-3 text-left transition hover:bg-white/10"
                    onClick={() => {
                      if (isImageMimeType(m.fileUrl!)) {
                        openLightbox(m.fileUrl!, m.fileName || "Arquivo");
                      } else {
                        const a = document.createElement("a");
                        a.href = m.fileUrl!;
                        a.download = m.fileName || "arquivo";
                        a.target = "_blank";
                        a.rel = "noopener noreferrer";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }
                    }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-brand-500/20 text-brand-300">
                      {isImageMimeType(m.fileUrl!) ? (
                        <ImageIcon className="h-5 w-5" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {m.fileName || m.content}
                      </p>
                      <p className="text-[10px] opacity-50">
                        {getFileExtension(m.fileName)} • Clique para baixar
                      </p>
                    </div>
                    <Download className="h-4 w-4 shrink-0 opacity-40" />
                  </button>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                )}

                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    mine ? "text-brand-100" : "text-slate-500"
                  )}
                >
                  {format(new Date(m.createdAt), "HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-center gap-2 border-t border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Sending indicator */}
      {sending && (
        <div className="border-t border-surface-border bg-brand-600/10 px-4 py-1.5 text-xs text-brand-300">
          Enviando...
        </div>
      )}

      {/* Input bar */}
      {!readOnly && (
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-surface-border bg-surface-card/80 px-3 py-2"
        >
          <label className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-slate-200">
            <ImageIcon className="h-5 w-5" />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e, "IMAGE")}
            />
          </label>
          <label className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-slate-200">
            <Paperclip className="h-5 w-5" />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFile(e, "FILE")}
            />
          </label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Digite sua mensagem..."
            className="flex-1 rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <Button
            type="submit"
            size="sm"
            disabled={sending || !text.trim()}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
      {readOnly && (
        <p className="border-t border-surface-border p-4 text-center text-sm text-amber-400">
          Modo leitura — assine para enviar mensagens.
        </p>
      )}

      {/* Lightbox overlay */}
      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          alt={lightboxAlt}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </div>
  );
}
