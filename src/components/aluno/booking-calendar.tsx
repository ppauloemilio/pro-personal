"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type BookingCalendarProps = {
  vinculoId: string;
  datesWithSlots: string[];
  selectedDate?: string;
};

export function BookingCalendar({
  vinculoId,
  datesWithSlots,
  selectedDate,
}: BookingCalendarProps) {
  const router = useRouter();
  const today = startOfDay(new Date());
  const availableDates = useMemo(() => new Set(datesWithSlots), [datesWithSlots]);

  const [month, setMonth] = useState(() => {
    if (selectedDate) return startOfMonth(parseISO(selectedDate));
    const firstAvailable = datesWithSlots[0];
    if (firstAvailable) return startOfMonth(parseISO(firstAvailable));
    return startOfMonth(today);
  });

  const days = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 0 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
    });
  }, [month]);

  function selectDate(date: Date) {
    const key = format(date, "yyyy-MM-dd");
    if (!availableDates.has(key)) return;
    router.push(`/aluno/agendar?vinculoId=${vinculoId}&date=${key}`);
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setMonth((current) => addMonths(current, -1))}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="font-medium capitalize text-white">
          {format(month, "MMMM yyyy", { locale: ptBR })}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setMonth((current) => addMonths(current, 1))}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, month);
          const isPast = isBefore(day, today);
          const hasSlots = availableDates.has(key);
          const isSelected = selectedDate ? isSameDay(day, parseISO(selectedDate)) : false;
          const isClickable = inMonth && !isPast && hasSlots;

          return (
            <button
              key={key}
              type="button"
              disabled={!isClickable}
              onClick={() => selectDate(day)}
              className={cn(
                "aspect-square rounded-lg text-sm transition",
                !inMonth && "text-slate-700",
                inMonth && !hasSlots && "text-slate-600",
                inMonth && hasSlots && !isPast && "bg-brand-500/10 font-medium text-brand-300 hover:bg-brand-500/20",
                isPast && inMonth && "text-slate-700",
                isSelected && "bg-brand-500 text-white hover:bg-brand-500"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Dias em verde têm horários disponíveis. Toque no dia para ver os horários.
      </p>
    </div>
  );
}
