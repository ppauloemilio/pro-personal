import Link from "next/link";

import { redirect } from "next/navigation";

import { format, parseISO } from "date-fns";

import { ptBR } from "date-fns/locale";

import { getSession } from "@/lib/auth";

import { getStudentContext, getAvailableSlots } from "@/lib/data";

import { prisma } from "@/lib/prisma";

import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { PersonalPicker } from "@/components/aluno/personal-picker";

import { BookingCalendar } from "@/components/aluno/booking-calendar";

import { BookingSlotList } from "@/components/aluno/booking-slot-list";

import { ArrowLeft } from "lucide-react";



export default async function AlunoAgendarPage({

  searchParams,

}: {

  searchParams: Promise<{ vinculoId?: string; date?: string }>;

}) {

  const session = await getSession();

  const params = await searchParams;

  const ctx = await getStudentContext(session!.id);



  const activeVinculos = ctx.vinculos.filter((v) => v.status === "ATIVO");

  if (activeVinculos.length === 0) {

    redirect("/aluno");

  }



  if (!params.vinculoId) {

    const personalIds = activeVinculos.map((v) => v.personalId);

    const profiles = await prisma.personalProfile.findMany({

      where: { userId: { in: personalIds } },

      include: {

        categories: { include: { category: true } },

        locations: true,

      },

    });

    const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));



    return (

      <PersonalPicker

        vinculos={activeVinculos.map((vinculo) => {

          const profile = profileByUserId.get(vinculo.personalId);

          return {

            vinculoId: vinculo.id,

            personalName: vinculo.personal.name,

            categories:

              profile?.categories.map((c) => c.category.name) || [],

            locationNames: profile?.locations.map((l) => l.name) || [],

          };

        })}

      />

    );

  }



  const vinculo = activeVinculos.find((v) => v.id === params.vinculoId);

  if (!vinculo) redirect("/aluno/agendar");



  const slots = await getAvailableSlots(vinculo.personalId, 90);

  const datesWithSlots = [

    ...new Set(slots.map((slot) => format(slot.startAt, "yyyy-MM-dd"))),

  ].sort();



  const selectedDate = params.date;

  const daySlots = selectedDate

    ? slots

        .filter((slot) => format(slot.startAt, "yyyy-MM-dd") === selectedDate)

        .map((slot) => ({

          startAt: slot.startAt.toISOString(),

          endAt: slot.endAt.toISOString(),

          locationId: slot.locationId,

          locationName: slot.locationName,

          locationAddress: slot.locationAddress,

          locationMapUrl: slot.locationMapUrl,

        }))

    : [];



  return (

    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-3">

        <Link href="/aluno/agendar">

          <Button variant="ghost" size="sm">

            <ArrowLeft className="h-4 w-4" />

            Trocar personal

          </Button>

        </Link>

        <p className="text-sm text-slate-400">

          Agendando com{" "}

          <span className="font-medium text-white">{vinculo.personal.name}</span>

        </p>

      </div>



      {datesWithSlots.length === 0 ? (

        <Card className="text-slate-400">

          Nenhum horário livre nos próximos 90 dias. Peça ao personal para

          configurar disponibilidade.

        </Card>

      ) : (

        <>

          <div>

            <h2 className="text-lg font-semibold text-white">Escolha o dia</h2>

            <p className="mt-1 text-sm text-slate-400">

              Selecione uma data no calendário para ver os horários disponíveis.

            </p>

          </div>



          <BookingCalendar

            vinculoId={vinculo.id}

            datesWithSlots={datesWithSlots}

            selectedDate={selectedDate}

          />



          {selectedDate ? (

            <BookingSlotList

              vinculoId={vinculo.id}

              dateLabel={format(parseISO(selectedDate), "EEEE, dd/MM/yyyy", {

                locale: ptBR,

              })}

              slots={daySlots}

            />

          ) : (

            <Card className="text-center text-sm text-slate-400">

              Selecione um dia no calendário para ver os horários.

            </Card>

          )}

        </>

      )}

    </div>

  );

}

