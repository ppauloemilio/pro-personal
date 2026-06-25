/**
 * Default availability rules for new personais.
 * Seg-Sex: 8h-12h and 13h-22h
 * Sáb/Dom: no default (personal can add manually)
 */

export const DEFAULT_AVAILABILITY: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
}[] = [
  // Segunda (1)
  { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", slotMinutes: 60 },
  { dayOfWeek: 1, startTime: "13:00", endTime: "22:00", slotMinutes: 60 },
  // Terça (2)
  { dayOfWeek: 2, startTime: "08:00", endTime: "12:00", slotMinutes: 60 },
  { dayOfWeek: 2, startTime: "13:00", endTime: "22:00", slotMinutes: 60 },
  // Quarta (3)
  { dayOfWeek: 3, startTime: "08:00", endTime: "12:00", slotMinutes: 60 },
  { dayOfWeek: 3, startTime: "13:00", endTime: "22:00", slotMinutes: 60 },
  // Quinta (4)
  { dayOfWeek: 4, startTime: "08:00", endTime: "12:00", slotMinutes: 60 },
  { dayOfWeek: 4, startTime: "13:00", endTime: "22:00", slotMinutes: 60 },
  // Sexta (5)
  { dayOfWeek: 5, startTime: "08:00", endTime: "12:00", slotMinutes: 60 },
  { dayOfWeek: 5, startTime: "13:00", endTime: "22:00", slotMinutes: 60 },
];
