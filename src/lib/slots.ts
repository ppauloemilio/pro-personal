import {
  addMinutes,
  addHours,
  addDays,
  startOfDay,
  isBefore,
  isEqual,
  parseISO,
  setHours,
  setMinutes,
} from "date-fns";

export type SlotCandidate = {
  startAt: Date;
  endAt: Date;
  locationId: string;
  locationName: string;
  locationAddress: string;
  locationMapUrl: string | null;
};

type AvailabilityInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  locationId: string;
  locationName: string;
  locationAddress: string;
  locationMapUrl: string | null;
};

type OccupiedSlot = { startAt: Date; endAt: Date; locationId: string };

function parseTimeOnDate(base: Date, time: string) {
  const [h, m] = time.split(":").map(Number);
  return setMinutes(setHours(base, h), m);
}

function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
) {
  return aStart < bEnd && bStart < aEnd;
}

export function generateSlotsForRange(
  from: Date,
  days: number,
  availability: AvailabilityInput[],
  occupied: OccupiedSlot[],
  blocks: { startAt: Date; endAt: Date }[]
): SlotCandidate[] {
  const slots: SlotCandidate[] = [];
  const now = new Date();

  for (let d = 0; d < days; d++) {
    const day = addDays(startOfDay(from), d);
    const dow = day.getDay();

    for (const rule of availability) {
      if (rule.dayOfWeek !== dow) continue;

      let cursor = parseTimeOnDate(day, rule.startTime);
      const dayEnd = parseTimeOnDate(day, rule.endTime);

      while (addMinutes(cursor, rule.slotMinutes) <= dayEnd) {
        const slotEnd = addMinutes(cursor, rule.slotMinutes);
        if (isBefore(slotEnd, now) && !isEqual(slotEnd, now)) {
          cursor = slotEnd;
          continue;
        }

        const blocked = blocks.some((b) =>
          rangesOverlap(cursor, slotEnd, b.startAt, b.endAt)
        );
        const taken = occupied.some(
          (o) =>
            o.locationId === rule.locationId &&
            rangesOverlap(cursor, slotEnd, o.startAt, o.endAt)
        );

        if (!blocked && !taken) {
          slots.push({
            startAt: new Date(cursor),
            endAt: new Date(slotEnd),
            locationId: rule.locationId,
            locationName: rule.locationName,
            locationAddress: rule.locationAddress,
            locationMapUrl: rule.locationMapUrl,
          });
        }
        cursor = slotEnd;
      }
    }
  }

  return slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

export function parseBookingRange(startAt: string, endAt: string) {
  return { startAt: parseISO(startAt), endAt: parseISO(endAt) };
}

export function canCancelWithNotice(startAt: Date, isPersonal = false) {
  if (isPersonal) return true;
  return canStudentRequestCancellation(startAt);
}

export function canStudentRequestCancellation(startAt: Date) {
  const twentyFourHoursFromNow = addHours(new Date(), 24);
  return !isBefore(startAt, twentyFourHoursFromNow);
}
