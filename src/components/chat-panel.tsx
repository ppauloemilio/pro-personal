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
  Loader2,
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

function isImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("data:image/")) return true;
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)/i.test(url.split("?")[0]);
}

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("data:video/")) return true;
  return /\.(mp4|webm|ogg|mov)/i.test(url.split("?")[0]);
}

/* ─── File thumbnail in chat ─── */
function FileThumbnail({
  fileUrl,
  fileName,
  content,
  openLightbox,
}: {
  fileUrl: string;
  fileName: string | null;
  content: string;
  openLightbox: (src: string, alt: string) => void;
}) {
  // Image: show thumbnail, click to enlarge
  if (isImageUrl(fileUrl)) {
    return (
      <button
        type="button"
        className="group block cursor-pointer rounded-lg transition hover:opacity-80"
        onClick={() => openLightbox(fileUrl, fileName || content)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileUrl}
          alt={fileName || content}
          className="max-h-48 max-w-full rounded-lg object-cover"
          loading="lazy"
        />
        <span className="mt-1 block text-[11px] opacity-60 group-hover:opacity-100 transition">
          {fileName || "Imagem"} — Clique para ampliar
        </span>
      </button>
    );
  }

  // Video: show player inline
  if (isVideoUrl(fileUrl)) {
    return (
      <div className="max-w-full">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={fileUrl}
          controls
          className="max-h-48 max-w-full rounded-lg"
          preload="metadata"
        />
        <p className="mt-1 truncate text-[11px] opacity-60">
          {fileName || "Vídeo"}
        </p>
      </div>
    );
  }

  // Other file: show file card with download
  return (
    <a
      href={fileUrl}
      download={fileName || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center gap-2 rounded-lg bg-white/5 p-3 text-left transition hover:bg-white/10"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-brand-500/20 text-brand-300">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">
          {fileName || content}
        </p>
        <p className="text-[10px] opacity-50">
          {getFileExtension(fileName)} • Clique para baixar
        </p>
      </div>
      <Download className="h-4 w-4 shrink-0 opacity-40" />
    </a>
  );
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
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Sync with server data on re-render (when server revalidates)
  useEffect(() => {
    setMessages(initial);
  }, [initial]);

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

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const msg = text.trim();
    if (!msg || sending || readOnly) return;

    setSending(true);
    setErrorMsg(null);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      content: msg,
      type: "TEXT",
      fileUrl: null,
      fileName: null,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: "Você" },
    };

    // Optimistic update
    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");

    try {
      const res = await sendMessageAction(conversationId, msg);
      if (res.error) {
        setErrorMsg(res.error);
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setText(msg); // Restore text
      }
      // On success, the revalidation will trigger server re-render with updated data
      // which will sync via the useEffect above
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao enviar mensagem.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(msg);
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

    // Validate file size (8MB max)
    const MAX_SIZE = 8 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg("Arquivo muito grande. Máximo: 8MB.");
      return;
    }

    setSending(true);
    setErrorMsg(null);

    const tempId = `temp-${Date.now()}`;
    const isImage = type === "IMAGE" || file.type.startsWith("image/");

    // Create preview URL for optimistic rendering
    const previewUrl = isImage ? URL.createObjectURL(file) : null;

    const optimisticMsg: Message = {
      id: tempId,
      content: isImage ? "📷 Enviando imagem..." : `📎 Enviando ${file.name}...`,
      type: isImage ? "IMAGE" : "FILE",
      fileUrl: previewUrl,
      fileName: file.name,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: "Você" },
    };

    // Optimistic update
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await uploadFileAction(fd);
      if (up.error) {
        setErrorMsg(up.error);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        return;
      }
      if (up.url) {
        const actualType = isImage ? "IMAGE" : "FILE";
        const contentText = isImage ? "📷 Imagem" : `📎 ${up.fileName}`;
        const res = await sendMessageAction(
          conversationId,
          contentText,
          actualType,
          up.url,
          up.fileName
        );
        if (res.error) {
          setErrorMsg(res.error);
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          return;
        }
        // Replace optimistic with actual data (keeping the same tempId for smooth UX)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  content: isImage ? "Imagem enviada" : up.fileName || "Arquivo",
                  type: actualType,
                  fileUrl: up.url,
                  fileName: up.fileName || null,
                }
              : m
          )
        );
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao enviar arquivo.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-220px)] min-h-[400px] flex-col rounded-2xl border border-surface-border bg-surface-card/50">
      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-500">
              Nenhuma mensagem ainda. Diga olá! 👋
            </p>
          </div>
        )}
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

                {/* IMAGE or FILE with thumbnail */}
                {m.fileUrl ? (
                  <FileThumbnail
                    fileUrl={m.fileUrl}
                    fileName={m.fileName}
                    content={m.content}
                    openLightbox={openLightbox}
                  />
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
        <div className="flex items-center gap-2 border-t border-surface-border bg-brand-600/10 px-4 py-1.5 text-xs text-brand-300">
          <Loader2 className="h-3 w-3 animate-spin" />
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
              accept="image/*,video/*"
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
                handleSend();
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
