import { prisma } from "./prisma";
import { generateSlotsForRange } from "./slots";
import { addDays, startOfDay } from "date-fns";

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function getUserNotifications(userId: string, limit = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      body: true,
      link: true,
      read: true,
      createdAt: true,
    },
  });
}

export async function getPersonalDashboard(userId: string) {
  const profile = await prisma.personalProfile.findUnique({
    where: { userId },
  });
  if (!profile) return null;

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const [pendingBookings, todayBookings, activeStudents, pendingVinculos] =
    await Promise.all([
      prisma.booking.count({
        where: {
          status: "PENDENTE",
          vinculo: { personalId: userId },
        },
      }),
      prisma.booking.findMany({
        where: {
          status: "CONFIRMADA",
          startAt: { gte: today, lt: tomorrow },
          vinculo: { personalId: userId },
        },
        include: {
          vinculo: { include: { student: true } },
        },
        orderBy: { startAt: "asc" },
      }),
      prisma.vinculo.count({
        where: { personalId: userId, status: "ATIVO" },
      }),
      prisma.vinculo.findMany({
        where: { personalId: userId, status: "PENDENTE" },
        include: { student: true },
      }),
    ]);

  return {
    profile,
    pendingBookings,
    todayBookings,
    activeStudents,
    pendingVinculos,
  };
}

export async function getAvailableSlots(personalUserId: string, days = 14) {
  const profile = await prisma.personalProfile.findUnique({
    where: { userId: personalUserId },
    include: {
      locations: true,
      blocks: true,
    },
  });
  if (!profile) return [];

  const rules = await prisma.availabilityRule.findMany({
    where: { personalId: profile.id },
    include: { location: true },
  });

  const bookings = await prisma.booking.findMany({
    where: {
      vinculo: { personalId: personalUserId },
      status: { in: ["PENDENTE", "CONFIRMADA", "CANCELAMENTO_SOLICITADO"] },
      startAt: { gte: new Date() },
    },
  });

  const availability = rules.map((r) => ({
    dayOfWeek: r.dayOfWeek,
    startTime: r.startTime,
    endTime: r.endTime,
    slotMinutes: r.slotMinutes,
    locationId: r.locationId,
    locationName: r.location.name,
    locationAddress: r.location.address,
    locationMapUrl: r.location.mapUrl,
  }));

  const occupied = bookings.map((b) => ({
    startAt: b.startAt,
    endAt: b.endAt,
    locationId: b.locationId,
  }));

  return generateSlotsForRange(
    new Date(),
    days,
    availability,
    occupied,
    profile.blocks.map((b) => ({ startAt: b.startAt, endAt: b.endAt }))
  );
}

export async function getDiscoveryPersonals(filters?: {
  category?: string;
  city?: string;
  q?: string;
}) {
  const personals = await prisma.personalProfile.findMany({
    where: {
      isPublic: true,
      user: { status: "ATIVO" },
      ...(filters?.q
        ? {
            OR: [
              { bio: { contains: filters.q } },
              { user: { name: { contains: filters.q } } },
            ],
          }
        : {}),
      ...(filters?.city
        ? { locations: { some: { city: { contains: filters.city } } } }
        : {}),
      ...(filters?.category
        ? {
            categories: {
              some: { category: { slug: filters.category } },
            },
          }
        : {}),
    },
    include: {
      user: true,
      categories: { include: { category: true } },
      locations: true,
    },
    take: 24,
  });

  return personals;
}

export async function getStudentContext(userId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      user: true,
    },
  });

  const vinculos = await prisma.vinculo.findMany({
    where: { studentId: userId, status: { in: ["ATIVO", "PENDENTE"] } },
    include: {
      personal: {
        include: {
          personalProfile: {
            include: { categories: { include: { category: true } } },
          },
        },
      },
    },
  });

  const activeId = student?.activeVinculoId || vinculos.find((v) => v.status === "ATIVO")?.id;
  const active = vinculos.find((v) => v.id === activeId) || vinculos[0];

  return { student, vinculos, activeVinculo: active };
}
