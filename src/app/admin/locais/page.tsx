import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  adminDeleteLocationFormAction,
  adminUpdateLocationFormAction,
} from "@/lib/actions";
import { MapPin, Users } from "lucide-react";
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

  // Group by unique name+address combo to avoid duplicates
  const grouped = new Map<string, {
    key: string;
    name: string;
    address: string;
    city: string | null;
    notes: string | null;
    personalNames: string[];
    locationIds: string[];
    totalBookings: number;
    totalAvailability: number;
    locations: typeof locations;
  }>();

  for (const loc of locations) {
    const key = `${loc.name}|||${loc.address}`.toLowerCase().trim();
    if (grouped.has(key)) {
      const g = grouped.get(key)!;
      if (!g.personalNames.includes(loc.personal.user.name)) {
        g.personalNames.push(loc.personal.user.name);
      }
      g.locationIds.push(loc.id);
      g.totalBookings += loc._count.bookings;
      g.totalAvailability += loc._count.availability;
      g.locations.push(loc);
    } else {
      grouped.set(key, {
        key,
        name: loc.name,
        address: loc.address,
        city: loc.city,
        notes: loc.notes,
        personalNames: [loc.personal.user.name],
        locationIds: [loc.id],
        totalBookings: loc._count.bookings,
        totalAvailability: loc._count.availability,
        locations: [loc],
      });
    }
  }

  const uniqueLocations = [...grouped.values()];

  return (
    <div className="space-y-6">
      <CardTitle>Locais de atendimento</CardTitle>
      <p className="text-sm text-slate-400">
        {uniqueLocations.length} local(is) único(s) · {locations.length} registro(s) total
      </p>

      {uniqueLocations.length === 0 ? (
        <Card className="text-center text-slate-400">
          Nenhum local cadastrado.
        </Card>
      ) : (
        <div className="space-y-3">
          {uniqueLocations.map((loc) => (
            <Card key={loc.key} className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-400" />
                  <p className="font-medium text-white">{loc.name}</p>
                </div>
                <p className="text-sm text-slate-400">{loc.address}</p>
                {loc.city && <p className="text-sm text-slate-500">{loc.city}</p>}
                {loc.notes && <p className="text-sm text-slate-500">Obs: {loc.notes}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Personais: {loc.personalNames.join(", ")}
                  </span>
                  <span>·</span>
                  <span>{loc.totalBookings} agendamento(s)</span>
                  <span>·</span>
                  <span>{loc.totalAvailability} regra(s) de disponibilidade</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {loc.locations.map((l) => (
                  <EditLocationForm key={l.id} location={l} />
                ))}
                {loc.totalBookings === 0 && loc.locations.map((l) => (
                  <form key={l.id} action={adminDeleteLocationFormAction}>
                    <input type="hidden" name="locationId" value={l.id} />
                    <Button type="submit" size="sm" variant="danger">Excluir ({l.personal.user.name})</Button>
                  </form>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
