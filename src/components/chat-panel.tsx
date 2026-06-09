"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import {
  markConversationReadAction,
  sendMessageAction,
  uploadFileAction,
} from "@/lib/actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Image, Paperclip, Send } from "lucide-react";
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    markConversationReadAction(conversationId);
  }, [conversationId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || readOnly) return;
    setSending(true);
    const res = await sendMessageAction(conversationId, text.trim());
    if (res.success) {
      setMessages([
        ...messages,
        {
          id: Date.now().toString(),
          content: text.trim(),
          type: "TEXT",
          fileUrl: null,
          fileName: null,
          createdAt: new Date().toISOString(),
          sender: { id: currentUserId, name: "Você" },
        },
      ]);
      setText("");
    }
    setSending(false);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>, type: "IMAGE" | "FILE") {
    const file = e.target.files?.[0];
    if (!file || readOnly) return;
    setSending(true);
    const fd = new FormData();
    fd.append("file", file);
    const up = await uploadFileAction(fd);
    if (up.url) {
      await sendMessageAction(
        conversationId,
        type === "IMAGE" ? "📷 Imagem" : `📎 ${up.fileName}`,
        type,
        up.url,
        up.fileName
      );
      setMessages([
        ...messages,
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
    setSending(false);
  }

  return (
    <div className="flex h-[calc(100dvh-220px)] min-h-[400px] flex-col rounded-2xl border border-surface-border bg-surface-card/50">
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
                {m.type === "IMAGE" && m.fileUrl ? (
                  <a href={m.fileUrl} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.fileUrl}
                      alt="Imagem enviada no chat"
                      className="max-h-48 rounded-lg"
                    />
                  </a>
                ) : m.fileUrl ? (
                  <a
                    href={m.fileUrl}
                    className="underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {m.fileName || m.content}
                  </a>
                ) : (
                  <p>{m.content}</p>
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

      {!readOnly && (
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-surface-border p-3"
        >
          <label className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-white/5">
            <Image className="h-5 w-5" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e, "IMAGE")}
            />
          </label>
          <label className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-white/5">
            <Paperclip className="h-5 w-5" />
            <input type="file" className="hidden" onChange={(e) => handleFile(e, "FILE")} />
          </label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={sending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
      {readOnly && (
        <p className="border-t border-surface-border p-4 text-center text-sm text-amber-400">
          Modo leitura — assine para enviar mensagens.
        </p>
      )}
    </div>
  );
}
