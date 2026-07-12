import { getSession } from "@/lib/auth";
import { getPersonalDashboard } from "@/lib/data";
import { getPersonalAccess } from "@/lib/permissions";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookingCard } from "@/components/booking-card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Calendar, AlertCircle, TrendingUp } from "lucide-react";
import { AcceptVinculoForm } from "@/components/forms/action-forms";

export default async function PersonalDashboardPage() {
  const session = await getSession();
  const dash = await getPersonalDashboard(session!.id);
  const access = await getPersonalAccess(session!.id);

  if (!dash) return <p>Complete seu perfil.</p>;

  return (
    <div className="space-y-8 animate-fade-in">
      {access.isReadOnly && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Modo leitura ativo</p>
            <p className="text-sm opacity-90">
              Seu trial expirou.{" "}
              <Link href="/personal/assinatura" className="underline">
                Assine um plano
              </Link>{" "}
              para continuar.
            </p>
          </div>
        </div>
      )}

      {access.canWrite && !access.isTrial && !access.isCancelled && (() => {
        const students = access.activeStudents;
        const tier = access.planTier;
        let limit = tier === "starter" ? 10 : tier === "pro" ? 30 : 999;
        let nextPlan = tier === "starter" ? "Pro" : tier === "pro" ? "Pro+" : null;
        let atLimit = students >= limit && nextPlan !== null;
        let nearLimit = students >= limit - 2 && !atLimit && nextPlan !== null;
        if (atLimit || nearLimit) {
          return (
            <div className="flex items-center gap-3 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 text-brand-200">
              <TrendingUp className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">
                  {atLimit
                    ? `Você atingiu o limite do plano ${access.planLabel}!`
                    : `Você está próximo do limite do plano ${access.planLabel}.`}
                </p>
                <p className="text-sm opacity-90">
                  {atLimit
                    ? `Faça upgrade para ${nextPlan} para continuar adicionando alunos.`
                    : `Considere fazer upgrade para ${nextPlan} em breve.`}{" "}
                  <Link href="/personal/assinatura" className="underline">
                    Ver planos
                  </Link>
                </p>
              </div>
            </div>
          );
        }
        return null;
      })()}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <Users className="mb-2 h-8 w-8 text-brand-400" />
          <p className="text-2xl font-bold text-white">{dash.activeStudents}</p>
          <p className="text-sm text-slate-400">Alunos ativos</p>
        </Card>
        <Card>
          <Calendar className="mb-2 h-8 w-8 text-brand-400" />
          <p className="text-2xl font-bold text-white">{dash.pendingBookings}</p>
          <p className="text-sm text-slate-400">Pedidos de agenda</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Plano atual</p>
          <p className="text-2xl font-bold text-brand-300">{access.planLabel}</p>
          {access.isTrial && access.trialEndsAt && (
            <Badge variant="info" className="mt-2">
              Trial até {format(access.trialEndsAt, "dd/MM/yyyy", { locale: ptBR })}
            </Badge>
          )}
        </Card>
      </div>

      {dash.pendingVinculos.length > 0 && (
        <section>
          <CardTitle className="mb-4">Solicitações de vínculo</CardTitle>
          <div className="space-y-3">
            {dash.pendingVinculos.map((v) => (
              <Card key={v.id} className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{v.student.name}</p>
                  <Badge variant="warning">{v.origem}</Badge>
                </div>
                {access.canAddStudents ? (
                  <AcceptVinculoForm vinculoId={v.id} />
                ) : (
                  <Badge variant="danger">Assinatura necessária</Badge>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>Aulas de hoje</CardTitle>
          <Link href="/personal/agenda">
            <Button variant="ghost" size="sm">
              Ver agenda
            </Button>
          </Link>
        </div>
        {dash.todayBookings.length === 0 ? (
          <Card className="text-center text-slate-400">
            Nenhuma aula confirmada para hoje.
          </Card>
        ) : (
          <div className="space-y-4">
            {dash.todayBookings.map((b) => (
              <BookingCard
                key={b.id}
                startAt={b.startAt}
                endAt={b.endAt}
                locationName={b.locationName}
                locationAddress={b.locationAddress}
                locationMapUrl={b.locationMapUrl}
                status={b.status}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
