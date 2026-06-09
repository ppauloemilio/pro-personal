"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  placeholder?: string;
  paramName?: string;
  preserveParams?: string[];
  className?: string;
  debounceMs?: number;
};

export function SearchInput({
  placeholder = "Buscar por nome ou e-mail...",
  paramName = "q",
  preserveParams = [],
  className,
  debounceMs = 300,
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentQuery = searchParams.get(paramName) || "";
  const [value, setValue] = useState(currentQuery);

  useEffect(() => {
    setValue(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value === currentQuery) return;

      const params = new URLSearchParams();
      for (const key of preserveParams) {
        const preserved = searchParams.get(key);
        if (preserved) params.set(key, preserved);
      }
      const trimmed = value.trim();
      if (trimmed) params.set(paramName, trimmed);

      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [
    value,
    currentQuery,
    pathname,
    router,
    paramName,
    preserveParams,
    searchParams,
    debounceMs,
  ]);

  function clear() {
    setValue("");
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full py-2.5 pl-10 pr-10"
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
