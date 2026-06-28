"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  adminUpdateCategoryFormAction,
  adminDeleteCategoryFormAction,
} from "@/lib/actions";

export function CategoryManager({
  id,
  name,
  personalCount,
}: {
  id: string;
  name: string;
  personalCount: number;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await adminUpdateCategoryFormAction(formData);
          setEditing(false);
        }}
        className="flex items-center gap-2 rounded-xl border border-brand-500/40 bg-surface-elevated px-4 py-3"
      >
        <input type="hidden" name="categoryId" value={id} />
        <input
          name="name"
          defaultValue={name}
          required
          className="flex-1 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-sm text-white focus:border-brand-500 focus:outline-none"
        />
        <Button type="submit" size="sm">
          Salvar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </form>
    );
  }

  if (deleting) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-surface-elevated px-4 py-3">
        <p className="flex-1 text-sm text-red-300">
          Excluir <strong>{name}</strong>?
          {personalCount > 0 && (
            <span className="text-amber-400"> ⚠️ Usada por {personalCount} personal(s)</span>
          )}
        </p>
        <form action={adminDeleteCategoryFormAction}>
          <input type="hidden" name="categoryId" value={id} />
          <Button type="submit" size="sm" variant="danger">
            Confirmar
          </Button>
        </form>
        <Button size="sm" variant="ghost" onClick={() => setDeleting(false)}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-elevated px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">{name}</span>
        {personalCount > 0 && (
          <span className="text-xs text-slate-500">({personalCount} personal{personalCount > 1 ? "s" : ""})</span>
        )}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          ✏️ Editar
        </Button>
        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setDeleting(true)}>
          🗑️ Excluir
        </Button>
      </div>
    </div>
  );
}
