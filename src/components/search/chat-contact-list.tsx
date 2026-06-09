"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { matchesSearch } from "@/lib/search";

export type ChatContact = {
  id: string;
  name: string;
  href: string;
  subtitle?: string;
  searchFields?: string[];
  hasUnread?: boolean;
};

type ChatContactListProps = {
  title: string;
  contacts: ChatContact[];
  selectedId?: string;
  emptyMessage?: string;
  noResultsMessage?: string;
};

export function ChatContactList({
  title,
  contacts,
  selectedId,
  emptyMessage = "Nenhum contato disponível.",
  noResultsMessage = "Nenhum contato encontrado.",
}: ChatContactListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return contacts.filter((contact) =>
      matchesSearch(
        query,
        contact.name,
        contact.subtitle,
        ...(contact.searchFields || [])
      )
    );
  }, [contacts, query]);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-400">{title}</p>
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar contato..."
          className="w-full py-2 pl-10 pr-10 text-sm"
          aria-label="Buscar contato"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mb-2 text-xs text-slate-500">
        {filtered.length} de {contacts.length} contato(s)
      </p>
      <div className="max-h-[calc(100dvh-280px)] space-y-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <p className="rounded-lg border border-surface-border bg-surface-card/50 px-3 py-2 text-sm text-slate-400">
            {emptyMessage}
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-lg border border-surface-border bg-surface-card/50 px-3 py-2 text-sm text-slate-400">
            {noResultsMessage}
          </p>
        ) : (
          filtered.map((contact) => (
            <Link
              key={contact.id}
              href={contact.href}
              className={cn(
                "block rounded-lg border border-surface-border px-3 py-2 text-sm transition hover:border-brand-500/40",
                selectedId === contact.id
                  ? "border-brand-500/50 bg-brand-500/10"
                  : "bg-surface-card/50",
                contact.hasUnread && selectedId !== contact.id && "border-brand-500/40 bg-brand-500/5"
              )}
            >
              <div className="flex items-center gap-2">
                <p className="font-medium text-white">{contact.name}</p>
                {contact.hasUnread && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                )}
              </div>
              {contact.subtitle && (
                <p className="truncate text-xs text-slate-400">{contact.subtitle}</p>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
