import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  adminDeleteLocationFormAction,
  adminUpdateLocationFormAction,
} from "@/lib/actions";
import { MapPin } from "lucide-react";
import { EditLocationForm } from "./edit-location-form";

export default async function AdminLocaisPage() {
  const locations = await prisma.location.findMany({
    include: {
      personal: {
        include: { user: true },
      },
      _count: { select: { bookings: true, availability: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <CardTitle>Locais de atendimento</CardTitle>
      <p className="text-sm text-slate-400">
        {locations.length} local(is) cadastrado(s) por personais
      </p>

      {locations.length === 0 ? (
        <Card className="text-center text-slate-400">
          Nenhum local cadastrado.
        </Card>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => (
            <Card key={loc.id} className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-400" />
                  <p className="font-medium text-white">{loc.name}</p>
                </div>
                <p className="text-sm text-slate-400">{loc.address}</p>
                {loc.city && <p className="text-sm text-slate-500">{loc.city}</p>}
                {loc.notes && <p className="text-sm text-slate-500">Obs: {loc.notes}</p>}
                <p className="mt-2 text-xs text-slate-500">
                  Personal: {loc.personal.user.name} · {loc._count.bookings} agendamento(s) · {loc._count.availability} regra(s) de disponibilidade
                </p>
              </div>
              <div className="flex gap-2">
                <EditLocationForm location={loc} />
                {loc._count.bookings === 0 && (
                  <form action={adminDeleteLocationFormAction}>
                    <input type="hidden" name="locationId" value={loc.id} />
                    <Button type="submit" size="sm" variant="danger">Excluir</Button>
                  </form>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
