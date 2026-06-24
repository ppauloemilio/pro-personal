"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { desvincularFormAction } from "@/lib/actions";

export function DesvincularButton({ vinculoId, role }: { vinculoId: string; role: "PERSONAL" | "ALUNO" }) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div>
      {!showForm ? (
        <Button
          type="button"
          size="sm"
          variant="danger"
          onClick={() => setShowForm(true)}
        >
          Desvincular
        </Button>
      ) : (
        <form action={desvincularFormAction} className="space-y-2 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <input type="hidden" name="vinculoId" value={vinculoId} />
          <p className="text-sm text-red-300">
            {role === "PERSONAL" ? "Desvincular este aluno?" : "Desvincular deste personal?"}
          </p>
          <textarea
            name="reason"
            required
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo do desligamento (obrigatório)..."
            className="w-full"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="danger">
              Confirmar desvinculação
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => { setShowForm(false); setReason(""); }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
