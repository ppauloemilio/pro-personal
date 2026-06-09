"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CALENDAR_TONE_STYLES,
  type CalendarDayEntry,
} from "@/lib/booking-calendar";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const LEGEND_DOT: Record<CalendarDayEntry["tone"], string> = {
  upcoming: "bg-brand-500/40",
  past: "bg-red-500/40",
  pending: "bg-amber-500/40",
  rejected: "bg-rejected-500/40",
};

type LegendItem = {
  tone: CalendarDayEntry["tone"];
  label: string;
};

type BookingMonthCalendarProps = {
  bookingsByDate: Record<string, CalendarDayEntry[]>;
  selectedDate?: string;
  basePath: string;
  legend: LegendItem[];
  startOnCurrentMonth?: boolean;
};

export function BookingMonthCalendar({
  bookingsByDate,
  selectedDate,
  basePath,
  legend,
  startOnCurrentMonth = false,
}: BookingMonthCalendarProps) {
  const router = useRouter();

  const [month, setMonth] = useState(() => {
    if (selectedDate) return startOfMonth(parseISO(selectedDate));
    if (startOnCurrentMonth) return startOfMonth(new Date());
    const firstDate = Object.keys(bookingsByDate).sort()[0];
    if (firstDate) return startOfMonth(parseISO(firstDate));
    return startOfMonth(new Date());
  });

  const days = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 0 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
    });
  }, [month]);

  function selectDate(dateKey: string) {
    router.push(`${basePath}?date=${dateKey}`);
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
          const dayBookings = bookingsByDate[key] || [];
          const hasBookings = dayBookings.length > 0;
          const isSelected = selectedDate
            ? isSameDay(day, parseISO(selectedDate))
            : false;

          return (
            <button
              key={key}
              type="button"
              disabled={!inMonth || !hasBookings}
              onClick={() => hasBookings && selectDate(key)}
              className={cn(
                "flex min-h-[88px] flex-col rounded-lg border p-1.5 text-left transition",
                !inMonth && "border-transparent opacity-30",
                inMonth && !hasBookings && "border-transparent text-slate-600",
                inMonth &&
                  hasBookings &&
                  "border-surface-border bg-surface-elevated/40 hover:border-brand-500/40",
                isSelected && "border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/40"
              )}
            >
              <span
                className={cn(
                  "mb-1 text-xs font-semibold",
                  inMonth ? "text-white" : "text-slate-700",
                  isSelected && "text-brand-300"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                {dayBookings.slice(0, 3).map((booking, index) => (
                  <span
                    key={`${key}-${booking.timeLabel}-${booking.tone}-${index}`}
                    className={cn(
                      "truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight",
                      CALENDAR_TONE_STYLES[booking.tone]
                    )}
                  >
                    {booking.timeLabel}
                  </span>
                ))}
                {dayBookings.length > 3 && (
                  <span className="text-[10px] text-slate-500">
                    +{dayBookings.length - 3}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        {legend.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded", LEGEND_DOT[item.tone])} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export type { CalendarDayEntry };
