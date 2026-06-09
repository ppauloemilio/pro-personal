import { formatDateTimeRange, cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { MapPin, ExternalLink } from "lucide-react";
import type { BookingStatus } from "@prisma/client";

const statusMap: Record<
  BookingStatus,
  { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "purple" }
> = {
  PENDENTE: { label: "Aguardando aprovação", variant: "warning" },
  CONFIRMADA: { label: "Confirmada", variant: "success" },
  RECUSADA: { label: "Recusada", variant: "purple" },
  CANCELADA: { label: "Cancelada", variant: "default" },
  CANCELAMENTO_SOLICITADO: {
    label: "Cancelamento solicitado",
    variant: "info",
  },
};

export function BookingCard({
  startAt,
  endAt,
  locationName,
  locationAddress,
  locationMapUrl,
  status,
  actions,
  highlight = false,
}: {
  startAt: Date | string;
  endAt: Date | string;
  locationName: string;
  locationAddress: string;
  locationMapUrl?: string | null;
  status: BookingStatus;
  actions?: React.ReactNode;
  highlight?: boolean;
}) {
  const s = statusMap[status];
  return (
    <Card
      className={cn(
        "space-y-3",
        highlight && status === "RECUSADA" &&
          "border-rejected-500/50 bg-rejected-500/5 ring-1 ring-rejected-500/30"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium capitalize text-white">
          {formatDateTimeRange(startAt, endAt)}
        </p>
        <Badge variant={s.variant}>{s.label}</Badge>
      </div>
      <div className="space-y-1 text-sm text-slate-400">
        <p className="flex items-center gap-2 font-medium text-brand-300">
          <MapPin className="h-4 w-4 shrink-0" />
          {locationName}
        </p>
        <p className="pl-6">{locationAddress}</p>
        {locationMapUrl && (
          <a
            href={locationMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 pl-6 text-brand-400 hover:text-brand-300"
          >
            Abrir no mapa
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 pt-2">{actions}</div>}
    </Card>
  );
}
