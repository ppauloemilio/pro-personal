import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getTrialEndDate } from "../src/lib/billing";
import { generateInviteCode, slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.exerciseComment.deleteMany();
  await prisma.exerciseLog.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.scheduleBlock.deleteMany();
  await prisma.availabilityRule.deleteMany();
  await prisma.categoryRequest.deleteMany();
  await prisma.personalCategory.deleteMany();
  await prisma.location.deleteMany();
  await prisma.vinculo.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.personalProfile.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("demo123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@propersonal.com",
      passwordHash: hash,
      name: "Admin Pro-Personal",
      role: "ADMIN",
    },
  });

  const personal = await prisma.user.create({
    data: {
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
          trialEndsAt: getTrialEndDate(),
          planLabel: "Trial",
        },
      },
    },
    include: { personalProfile: true },
  });

  const personal2 = await prisma.user.create({
    data: {
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
          trialEndsAt: getTrialEndDate(new Date(Date.now() - 40 * 86400000)),
          planLabel: "Starter",
          monthlyAmount: 20,
          activeStudents: 1,
          activatedAt: new Date(),
        },
      },
    },
    include: { personalProfile: true },
  });

  const aluno = await prisma.user.create({
    data: {
      email: "aluno@demo.com",
      passwordHash: hash,
      name: "João Almeida",
      role: "ALUNO",
      studentProfile: { create: {} },
    },
  });

  const categories = await Promise.all(
    [
      "Musculação",
      "Boxe",
      "Jiu-jitsu",
      "Funcional",
      "Crossfit",
      "Pilates",
      "Natação",
      "Corrida",
    ].map((name) =>
      prisma.category.create({
        data: { name, slug: slugify(name) },
      })
    )
  );

  const musc = categories.find((c) => c.name === "Musculação")!;
  const boxe = categories.find((c) => c.name === "Boxe")!;

  await prisma.personalCategory.createMany({
    data: [
      { personalId: personal.personalProfile!.id, categoryId: musc.id },
      { personalId: personal2.personalProfile!.id, categoryId: boxe.id },
    ],
  });

  const loc1 = await prisma.location.create({
    data: {
      personalId: personal.personalProfile!.id,
      name: "Academia FitPro – Centro",
      address: "Rua das Flores, 120 – Centro – São Paulo/SP",
      city: "São Paulo",
      mapUrl: "https://maps.google.com",
    },
  });

  const loc2 = await prisma.location.create({
    data: {
      personalId: personal.personalProfile!.id,
      name: "Academia Iron – Zona Sul",
      address: "Av. Paulista, 800 – Bela Vista – São Paulo/SP",
      city: "São Paulo",
      mapUrl: "https://maps.google.com",
    },
  });

  await prisma.availabilityRule.createMany({
    data: [
      {
        personalId: personal.personalProfile!.id,
        locationId: loc1.id,
        dayOfWeek: 2,
        startTime: "08:00",
        endTime: "12:00",
        slotMinutes: 60,
      },
      {
        personalId: personal.personalProfile!.id,
        locationId: loc1.id,
        dayOfWeek: 4,
        startTime: "14:00",
        endTime: "18:00",
        slotMinutes: 60,
      },
      {
        personalId: personal.personalProfile!.id,
        locationId: loc2.id,
        dayOfWeek: 3,
        startTime: "07:00",
        endTime: "11:00",
        slotMinutes: 60,
      },
    ],
  });

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

  const workout = await prisma.workout.create({
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

  const nextTuesday = new Date();
  nextTuesday.setDate(
    nextTuesday.getDate() + ((2 + 7 - nextTuesday.getDay()) % 7 || 7)
  );
  nextTuesday.setHours(9, 0, 0, 0);
  const end = new Date(nextTuesday);
  end.setHours(10, 0, 0, 0);

  await prisma.booking.create({
    data: {
      vinculoId: vinculo.id,
      locationId: loc1.id,
      startAt: nextTuesday,
      endAt: end,
      status: "CONFIRMADA",
      locationName: loc1.name,
      locationAddress: loc1.address,
      locationMapUrl: loc1.mapUrl,
    },
  });

  console.log("\n✅ Seed concluído!\n");
  console.log("Contas demo (senha: demo123):");
  console.log("  Admin:    admin@propersonal.com");
  console.log("  Personal: personal@demo.com | ana@demo.com");
  console.log("  Aluno:    aluno@demo.com");
  console.log("  Convite:  DEMO2024\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
