"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { matchesSearch } from "@/lib/search";

export type PersonalChatContact = {
  id: string;
  name: string;
  email: string;
  href: string;
  lastMessage?: string;
  hasUnread?: boolean;
};

type PersonalChatContactListProps = {
  contacts: PersonalChatContact[];
};

export function PersonalChatContactList({ contacts }: PersonalChatContactListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return contacts.filter((contact) =>
      matchesSearch(query, contact.name, contact.email, contact.lastMessage)
    );
  }, [contacts, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar aluno por nome ou e-mail..."
          className="w-full py-2.5 pl-10 pr-10"
          aria-label="Buscar aluno"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        {filtered.length} de {contacts.length} aluno(s)
      </p>
      {contacts.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum aluno vinculado para chat.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum aluno encontrado.</p>
      ) : (
        filtered.map((contact) => (
          <Link key={contact.id} href={contact.href}>
            <Card
              className={`flex items-center gap-4 p-4 transition hover:border-brand-500/40 ${
                contact.hasUnread ? "border-brand-500/40 bg-brand-500/5" : ""
              }`}
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/20">
                <MessageCircle className="h-5 w-5 text-brand-400" />
                {contact.hasUnread && (
                  <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-brand-400 ring-2 ring-surface-card" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white">{contact.name}</p>
                  {contact.hasUnread && (
                    <span className="text-xs font-medium text-brand-300">Novo</span>
                  )}
                </div>
                <p className="truncate text-sm text-slate-400">
                  {contact.lastMessage || contact.email || "Iniciar conversa"}
                </p>
              </div>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}
