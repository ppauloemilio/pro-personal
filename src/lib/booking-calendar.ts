import { format, isBefore } from "date-fns";
import type { BookingStatus } from "@prisma/client";

export type CalendarDayEntry = {
  timeLabel: string;
  tone: "upcoming" | "past" | "pending" | "rejected";
};

export function getBookingCalendarTone(
  status: BookingStatus,
  endAt: Date,
  now: Date = new Date()
): CalendarDayEntry["tone"] {
  if (status === "RECUSADA") return "rejected";
  if (status === "PENDENTE" || status === "CANCELAMENTO_SOLICITADO") return "pending";
  if (isBefore(endAt, now)) return "past";
  return "upcoming";
}

export function buildBookingsByDate(
  bookings: { startAt: Date; endAt: Date; status: BookingStatus }[]
): Record<string, CalendarDayEntry[]> {
  const map: Record<string, CalendarDayEntry[]> = {};

  for (const booking of bookings) {
    const dateKey = format(booking.startAt, "yyyy-MM-dd");
    const entry: CalendarDayEntry = {
      timeLabel: format(booking.startAt, "HH:mm"),
      tone: getBookingCalendarTone(booking.status, booking.endAt),
    };
    if (!map[dateKey]) map[dateKey] = [];
    map[dateKey].push(entry);
  }

  for (const dateKey of Object.keys(map)) {
    map[dateKey].sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
  }

  return map;
}

export const CALENDAR_TONE_STYLES: Record<CalendarDayEntry["tone"], string> = {
  upcoming: "bg-brand-500/20 text-brand-300",
  past: "bg-red-500/20 text-red-300",
  pending: "bg-amber-500/20 text-amber-300",
  rejected: "bg-rejected-500/20 text-rejected-300",
};
