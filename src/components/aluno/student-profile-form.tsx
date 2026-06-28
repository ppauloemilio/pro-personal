"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateStudentProfileAction } from "@/lib/actions";

export function StudentProfileForm({
  initialName,
  initialEmail,
  initialPhone,
  initialAge,
  initialObservation,
}: {
  initialName: string;
  initialEmail: string;
  initialPhone: string | null;
  initialAge: number | null;
  initialObservation: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <div>
            <p className="text-xs text-slate-500">Nome</p>
            <p className="text-sm text-white">{initialName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">E-mail</p>
            <p className="text-sm text-white">{initialEmail}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Telefone</p>
            <p className="text-sm text-white">{initialPhone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Idade</p>
            <p className="text-sm text-white">{initialAge || "—"}</p>
          </div>
        </div>
        {initialObservation && (
          <div>
            <p className="text-xs text-slate-500">Observação</p>
            <p className="text-sm text-white">{initialObservation}</p>
          </div>
        )}
        <Button size="sm" variant="outline" className="mt-2" onClick={() => { setError(null); setEditing(true); }}>
          ✏️ Editar perfil
        </Button>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        const result = await updateStudentProfileAction(formData);
        if (result && "error" in result) {
          setError(result.error);
        } else {
          setError(null);
          setEditing(false);
        }
      }}
      className="space-y-4"
    >
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-xs text-slate-400">Nome</label>
        <input
          name="name"
          required
          defaultValue={initialName}
          className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-400">E-mail</label>
        <input
          name="email"
          type="email"
          required
          defaultValue={initialEmail}
          className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Telefone</label>
          <input
            name="phone"
            type="tel"
            defaultValue={initialPhone || ""}
            placeholder="(11) 99999-9999"
            className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Idade</label>
          <input
            name="age"
            type="number"
            min={1}
            max={120}
            defaultValue={initialAge || ""}
            placeholder="Ex: 25"
            className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-400">Observação</label>
        <textarea
          name="observation"
          defaultValue={initialObservation || ""}
          rows={3}
          placeholder="Alergias, lesões, objetivos..."
          className="w-full rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none resize-none"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">Salvar</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
      </div>
    </form>
  );
}
