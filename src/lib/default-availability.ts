/**
 * Default availability rules for new personais.
 * Todos os dias: 8h–23h
 */

export const DEFAULT_AVAILABILITY: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
}[] = [
  // Domingo (0)
  { dayOfWeek: 0, startTime: "08:00", endTime: "23:00", slotMinutes: 60 },
  // Segunda (1)
  { dayOfWeek: 1, startTime: "08:00", endTime: "23:00", slotMinutes: 60 },
  // Terça (2)
  { dayOfWeek: 2, startTime: "08:00", endTime: "23:00", slotMinutes: 60 },
  // Quarta (3)
  { dayOfWeek: 3, startTime: "08:00", endTime: "23:00", slotMinutes: 60 },
  // Quinta (4)
  { dayOfWeek: 4, startTime: "08:00", endTime: "23:00", slotMinutes: 60 },
  // Sexta (5)
  { dayOfWeek: 5, startTime: "08:00", endTime: "23:00", slotMinutes: 60 },
  // Sábado (6)
  { dayOfWeek: 6, startTime: "08:00", endTime: "23:00", slotMinutes: 60 },
];
