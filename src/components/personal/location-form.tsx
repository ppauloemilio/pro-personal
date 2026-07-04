"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { saveLocationAction } from "@/lib/actions";

export type ExistingLocation = {
  name: string;
  address: string;
  city: string | null;
  mapUrl: string | null;
};

export function LocationForm({
  existingLocations,
}: {
  existingLocations: ExistingLocation[];
}) {
  const [mode, setMode] = useState<"select" | "new">("select");
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<ExistingLocation[]>([]);
  const [selected, setSelected] = useState<ExistingLocation | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // New location form fields
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newMapUrl, setNewMapUrl] = useState("");

  useEffect(() => {
    if (search.length < 2) {
      setFiltered([]);
      return;
    }
    const q = search.toLowerCase();
    const matches = existingLocations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        (l.city && l.city.toLowerCase().includes(q))
    );
    // Deduplicate by name
    const seen = new Set<string>();
    const unique = matches.filter((l) => {
      if (seen.has(l.name.toLowerCase())) return false;
      seen.add(l.name.toLowerCase());
      return true;
    });
    setFiltered(unique.slice(0, 8));
  }, [search, existingLocations]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(loc: ExistingLocation) {
    setSelected(loc);
    setSearch(loc.name);
    setShowDropdown(false);
  }

  function reset() {
    setSearch("");
    setSelected(null);
    setNewName("");
    setNewAddress("");
    setNewCity("");
    setNewMapUrl("");
  }

  if (mode === "new") {
    return (
      <form action={saveLocationAction} className="grid gap-3">
        <input
          name="name"
          required
          placeholder="Nome da academia"
          className="w-full"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          name="address"
          required
          placeholder="Endereço completo"
          className="w-full"
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value)}
        />
        <input
          name="city"
          placeholder="Cidade"
          className="w-full"
          value={newCity}
          onChange={(e) => setNewCity(e.target.value)}
        />
        <input
          name="mapUrl"
          placeholder="Link do mapa (opcional)"
          className="w-full"
          value={newMapUrl}
          onChange={(e) => setNewMapUrl(e.target.value)}
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm">
            + Adicionar local
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMode("select")}
          >
            ← Voltar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      {/* Select existing */}
      <div ref={wrapperRef} className="relative">
        <input
          type="text"
          placeholder="Buscar local já cadastrado..."
          className="w-full"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelected(null);
            setShowDropdown(true);
          }}
          onFocus={() => {
            if (search.length >= 2) setShowDropdown(true);
          }}
          autoComplete="off"
        />
        {showDropdown && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-surface-border bg-surface-elevated shadow-xl">
            {filtered.map((loc, i) => (
              <button
                key={i}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-brand-500/10 transition-colors"
                onClick={() => handleSelect(loc)}
              >
                <p className="font-medium text-white text-sm">{loc.name}</p>
                <p className="text-xs text-slate-400">{loc.address}{loc.city ? ` — ${loc.city}` : ""}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected existing location — confirm to add */}
      {selected && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
          <div>
            <p className="font-medium text-white">{selected.name}</p>
            <p className="text-sm text-slate-400">{selected.address}</p>
            {selected.city && <p className="text-xs text-slate-500">{selected.city}</p>}
          </div>
          <form action={saveLocationAction} className="flex gap-2">
            <input type="hidden" name="name" value={selected.name} />
            <input type="hidden" name="address" value={selected.address} />
            <input type="hidden" name="city" value={selected.city || ""} />
            <input type="hidden" name="mapUrl" value={selected.mapUrl || ""} />
            <Button type="submit" size="sm">
              + Adicionar este local
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={reset}
            >
              Cancelar
            </Button>
          </form>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <div className="h-px flex-1 bg-surface-border" />
        ou
        <div className="h-px flex-1 bg-surface-border" />
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => {
          setMode("new");
          reset();
        }}
      >
        + Cadastrar novo local
      </Button>
    </div>
  );
}
