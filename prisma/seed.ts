import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getTrialEndDateSync } from "../src/lib/billing";
import { generateInviteCode, slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("demo123", 10);

  // ── Users (upsert by unique email) ──────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@propersonal.com" },
    update: {},
    create: {
      email: "admin@propersonal.com",
      passwordHash: hash,
      name: "Admin Pro-Personal",
      role: "ADMIN",
    },
  });

  const personal = await prisma.user.upsert({
    where: { email: "personal@demo.com" },
    update: {},
    create: {
      email: "personal@demo.com",
      passwordHash: hash,
      name: "Carlos Silva",
      role: "PERSONAL",
      personalProfile: {
        create: {
          bio: "Personal especializado em musculação e condicionamento. 10 anos de experiência.",
          publicSlug: "carlos-silva",
          inviteCode: "DEMO2024",
          isPublic: true,
        },
      },
      subscription: {
        create: {
          status: "TRIAL",
          trialEndsAt: getTrialEndDateSync(),
          planLabel: "Trial",
        },
      },
    },
    include: { personalProfile: true },
  });

  const personal2 = await prisma.user.upsert({
    where: { email: "ana@demo.com" },
    update: {},
    create: {
      email: "ana@demo.com",
      passwordHash: hash,
      name: "Ana Costa",
      role: "PERSONAL",
      personalProfile: {
        create: {
          bio: "Especialista em boxe e condicionamento físico.",
          publicSlug: "ana-costa",
          inviteCode: generateInviteCode(),
          isPublic: true,
        },
      },
      subscription: {
        create: {
          status: "ATIVA",
          trialEndsAt: getTrialEndDateSync(new Date(Date.now() - 40 * 86400000)),
          planLabel: "Starter",
          monthlyAmount: 20,
          activeStudents: 1,
          activatedAt: new Date(),
        },
      },
    },
    include: { personalProfile: true },
  });

  const aluno = await prisma.user.upsert({
    where: { email: "aluno@demo.com" },
    update: {},
    create: {
      email: "aluno@demo.com",
      passwordHash: hash,
      name: "João Almeida",
      role: "ALUNO",
      studentProfile: { create: {} },
    },
  });

  // ── Categories (upsert by unique slug) ───────────────────────────
  const categoryData = [
    "Musculação",
    "Boxe",
    "Jiu-jitsu",
    "Funcional",
    "Crossfit",
    "Pilates",
    "Natação",
    "Corrida",
  ];

  const categories = await Promise.all(
    categoryData.map((name) =>
      prisma.category.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: { name, slug: slugify(name) },
      })
    )
  );

  const musc = categories.find((c) => c.name === "Musculação")!;
  const boxe = categories.find((c) => c.name === "Boxe")!;

  // ── PersonalCategory (skip if already exists) ──────────────────
  if (personal.personalProfile) {
    const existing1 = await prisma.personalCategory.findUnique({
      where: { personalId_categoryId: { personalId: personal.personalProfile.id, categoryId: musc.id } },
    });
    if (!existing1) {
      await prisma.personalCategory.create({
        data: { personalId: personal.personalProfile.id, categoryId: musc.id },
      });
    }
  }

  if (personal2.personalProfile) {
    const existing2 = await prisma.personalCategory.findUnique({
      where: { personalId_categoryId: { personalId: personal2.personalProfile.id, categoryId: boxe.id } },
    });
    if (!existing2) {
      await prisma.personalCategory.create({
        data: { personalId: personal2.personalProfile.id, categoryId: boxe.id },
      });
    }
  }

  // ── Locations (only seed if personal profile exists and no locations yet) ──
  if (personal.personalProfile) {
    const existingLocs = await prisma.location.count({
      where: { personalId: personal.personalProfile.id },
    });

    if (existingLocs === 0) {
      const loc1 = await prisma.location.create({
        data: {
          personalId: personal.personalProfile.id,
          name: "Academia FitPro – Centro",
          address: "Rua das Flores, 120 – Centro – São Paulo/SP",
          city: "São Paulo",
          mapUrl: "https://maps.google.com",
        },
      });

      const loc2 = await prisma.location.create({
        data: {
          personalId: personal.personalProfile.id,
          name: "Academia Iron – Zona Sul",
          address: "Av. Paulista, 800 – Bela Vista – São Paulo/SP",
          city: "São Paulo",
          mapUrl: "https://maps.google.com",
        },
      });

      // Availability rules (only if locations were just created)
      for (const rule of [
        {
          personalId: personal.personalProfile.id,
          locationId: loc1.id,
          dayOfWeek: 2,
          startTime: "08:00",
          endTime: "12:00",
          slotMinutes: 60,
        },
        {
          personalId: personal.personalProfile.id,
          locationId: loc1.id,
          dayOfWeek: 4,
          startTime: "14:00",
          endTime: "18:00",
          slotMinutes: 60,
        },
        {
          personalId: personal.personalProfile.id,
          locationId: loc2.id,
          dayOfWeek: 3,
          startTime: "07:00",
          endTime: "11:00",
          slotMinutes: 60,
        },
      ]) {
        const exists = await prisma.availabilityRule.findFirst({
          where: {
            personalId: rule.personalId,
            locationId: rule.locationId,
            dayOfWeek: rule.dayOfWeek,
            startTime: rule.startTime,
          },
        });
        if (!exists) {
          await prisma.availabilityRule.create({ data: rule });
        }
      }
    }
  }

  // ── Vínculo (only if it doesn't exist yet) ─────────────────────
  const existingVinculo = await prisma.vinculo.findUnique({
    where: { personalId_studentId: { personalId: personal.id, studentId: aluno.id } },
  });

  if (!existingVinculo) {
    const vinculo = await prisma.vinculo.create({
      data: {
        personalId: personal.id,
        studentId: aluno.id,
        status: "ATIVO",
        origem: "CONVITE",
      },
    });

    await prisma.studentProfile.update({
      where: { userId: aluno.id },
      data: { activeVinculoId: vinculo.id },
    });

    // Conversation + messages
    const conv = await prisma.conversation.create({
      data: { type: "VINCULO", vinculoId: vinculo.id },
    });

    await prisma.message.createMany({
      data: [
        {
          conversationId: conv.id,
          senderId: personal.id,
          content: "Olá João! Pronto para o treino de hoje?",
        },
        {
          conversationId: conv.id,
          senderId: aluno.id,
          content: "Sim! Estou a caminho da academia.",
        },
      ],
    });

    // Workout
    await prisma.workout.create({
      data: {
        vinculoId: vinculo.id,
        title: "Treino A – Peito e Tríceps",
        notes: "Aquecimento 10 min antes de iniciar.",
        exercises: {
          create: [
            {
              name: "Supino reto",
              sets: 4,
              reps: "10-12",
              load: "40kg",
              restSeconds: 90,
              orderIndex: 0,
              logs: { create: {} },
            },
            {
              name: "Crucifixo",
              sets: 3,
              reps: "12",
              load: "12kg",
              restSeconds: 60,
              orderIndex: 1,
              logs: { create: {} },
            },
            {
              name: "Tríceps pulley",
              sets: 3,
              reps: "15",
              load: "25kg",
              restSeconds: 60,
              orderIndex: 2,
              logs: { create: {} },
            },
          ],
        },
      },
    });

    // Booking
    const nextTuesday = new Date();
    nextTuesday.setDate(
      nextTuesday.getDate() + ((2 + 7 - nextTuesday.getDay()) % 7 || 7)
    );
    nextTuesday.setHours(9, 0, 0, 0);
    const end = new Date(nextTuesday);
    end.setHours(10, 0, 0, 0);

    const firstLoc = await prisma.location.findFirst({
      where: { personalId: personal.personalProfile!.id },
    });

    if (firstLoc) {
      await prisma.booking.create({
        data: {
          vinculoId: vinculo.id,
          locationId: firstLoc.id,
          startAt: nextTuesday,
          endAt: end,
          status: "CONFIRMADA",
          locationName: firstLoc.name,
          locationAddress: firstLoc.address,
          locationMapUrl: firstLoc.mapUrl,
        },
      });
    }
  }

  // ── Admin conversation (only if not yet created) ───────────────
  const existingAdminConv = await prisma.conversation.findUnique({
    where: { type_personalId: { type: "ADMIN_PERSONAL", personalId: personal.id } },
  });

  if (!existingAdminConv) {
    const adminConv = await prisma.conversation.create({
      data: { type: "ADMIN_PERSONAL", personalId: personal.id },
    });

    await prisma.message.create({
      data: {
        conversationId: adminConv.id,
        senderId: admin.id,
        content: "Bem-vindo ao Pro-Personal! Qualquer dúvida, estamos aqui.",
      },
    });
  }

  // ── AppConfig defaults ────────────────────────────────────────────
  const appConfigDefaults: Record<string, string> = {
    mp_access_token: "",
    mp_sandbox_mode: "true",
    trial_days: "7",
    plan_starter_price: "20",
    plan_pro_price: "50",
    plan_pro_plus_base: "50",
    plan_pro_plus_excess: "1.5",
  };

  for (const [key, value] of Object.entries(appConfigDefaults)) {
    await prisma.appConfig.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  console.log("\n✅ Seed concluído (idempotente)!\n");
  console.log("Contas demo (senha: demo123):");
  console.log("  Admin:    admin@propersonal.com");
  console.log("  Personal: personal@demo.com | ana@demo.com");
  console.log("  Aluno:    aluno@demo.com");
  console.log("  Convite:  DEMO2024\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
