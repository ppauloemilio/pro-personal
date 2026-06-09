import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEEE, dd/MM/yyyy · HH:mm", { locale: ptBR });
}

export function formatDateTimeRange(start: Date | string, end: Date | string) {
  const s = typeof start === "string" ? parseISO(start) : start;
  const e = typeof end === "string" ? parseISO(end) : end;
  return `${format(s, "EEEE, dd/MM/yyyy", { locale: ptBR })} · ${format(s, "HH:mm")} – ${format(e, "HH:mm")}`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateInviteCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}
