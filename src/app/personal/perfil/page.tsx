import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPersonalAccess } from "@/lib/permissions";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  updatePersonalProfileAction,
  saveLocationAction,
  saveAvailabilityAction,
  requestCategoryFormAction,
} from "@/lib/actions";
import { LocationList } from "@/components/personal/location-list";
import { AvailabilityList } from "@/components/personal/availability-list";
import { AvatarUpload } from "@/components/personal/avatar-upload";
import { PortfolioManager } from "@/components/personal/portfolio-manager";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default async function PersonalPerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  const access = await getPersonalAccess(session!.id);
  const params = await searchParams;

  const profile = await prisma.personalProfile.findUnique({
    where: { userId: session!.id },
    include: {
      categories: true,
      locations: true,
    },
  });

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const requests = profile
    ? await prisma.categoryRequest.findMany({
        where: { personalId: profile.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  const availabilityRules = profile
    ? await prisma.availabilityRule.findMany({
        where: { personalId: profile.id },
        include: { location: true },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      })
    : [];

  const portfolioPhotos = profile
    ? await prisma.portfolioPhoto.findMany({
        where: { personalId: profile.id },
        include: { category: true },
        orderBy: [{ categoryId: "asc" }, { orderIndex: "asc" }],
      })
    : [];

  const user = await prisma.user.findUnique({ where: { id: session!.id } });

  // Get all unique location names for auto-complete
  const allLocationNames = await prisma.location.findMany({
    select: { name: true, address: true, city: true },
    distinct: ["name"],
    orderBy: { name: "asc" },
    take: 50,
  });

  const selectedIds = new Set(profile?.categories.map((c) => c.categoryId));

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {params.error === "location_in_use" && (
        <Card className="border-red-500/30 bg-red-500/10 text-sm text-red-300">
          Não é possível excluir este local porque existem agendamentos vinculados a ele.
        </Card>
      )}

      {/* Foto de perfil */}
      <Card>
        <CardTitle>Foto de perfil</CardTitle>
        <div className="mt-4">
          <AvatarUpload currentAvatar={user?.avatarUrl || null} />
        </div>
      </Card>

      {/* Portfólio de fotos */}
      {profile && (
        <Card>
          <CardTitle>Portfólio de fotos</CardTitle>
          <p className="mt-2 text-sm text-slate-400">
            Adicione até 5 fotos por categoria para mostrar seu trabalho.
          </p>
          <div className="mt-4">
            <PortfolioManager
              photos={portfolioPhotos}
              categories={categories.filter((c) => selectedIds.has(c.id))}
            />
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Perfil público</CardTitle>
        {access.canWrite ? (
          <form action={updatePersonalProfileAction} className="mt-4 space-y-4">
            <textarea
              name="bio"
              rows={4}
              defaultValue={profile?.bio || ""}
              placeholder="Sua bio para descoberta..."
              className="w-full"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isPublic"
                defaultChecked={profile?.isPublic}
              />
              Perfil visível na descoberta
            </label>
            <div>
              <p className="mb-2 text-sm text-slate-400">Categorias</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-surface-border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="categoryIds"
                      value={c.id}
                      defaultChecked={selectedIds.has(c.id)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit">Salvar perfil</Button>
          </form>
        ) : (
          <p className="mt-4 text-slate-400">{profile?.bio || "—"}</p>
        )}
      </Card>

      <Card>
        <CardTitle>Solicitar nova categoria</CardTitle>
        {access.canWrite ? (
          <form action={requestCategoryFormAction} className="mt-4 space-y-3">
            <input name="name" required placeholder="Nome da categoria" className="w-full" />
            <textarea name="description" placeholder="Descrição (opcional)" className="w-full" />
            <Button type="submit" variant="secondary">
              Enviar para aprovação
            </Button>
          </form>
        ) : null}
        {requests.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {requests.map((r) => (
              <li key={r.id} className="text-slate-400">
                {r.name} — <span className="text-brand-300">{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Locais de atendimento</CardTitle>
        <div className="mt-4">
          <LocationList
            locations={profile?.locations || []}
            canWrite={access.canWrite}
          />
        </div>
        {access.canWrite && (
          <form action={saveLocationAction} className="mt-4 grid gap-3">
            <div className="relative">
              <input
                name="name"
                required
                placeholder="Nome da academia"
                className="w-full"
                list="academia-names"
                autoComplete="off"
              />
              <datalist id="academia-names">
                {allLocationNames.map((l) => (
                  <option key={l.name} value={l.name} />
                ))}
              </datalist>
            </div>
            <input name="address" required placeholder="Endereço completo" className="w-full" />
            <input name="city" placeholder="Cidade" className="w-full" />
            <input name="mapUrl" placeholder="Link do mapa (opcional)" className="w-full" />
            <Button type="submit" variant="secondary">
              + Adicionar local
            </Button>
          </form>
        )}
      </Card>

      <Card>
        <CardTitle>Disponibilidade semanal</CardTitle>
        <div className="mt-4">
          <AvailabilityList
            rules={availabilityRules.map((rule) => ({
              id: rule.id,
              locationId: rule.locationId,
              locationName: rule.location.name,
              dayOfWeek: rule.dayOfWeek,
              startTime: rule.startTime,
              endTime: rule.endTime,
              slotMinutes: rule.slotMinutes,
            }))}
            locations={profile?.locations.map((l) => ({ id: l.id, name: l.name })) || []}
            canWrite={access.canWrite}
          />
        </div>
        {access.canWrite && profile && profile.locations.length > 0 ? (
          <form action={saveAvailabilityAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <select name="locationId" required className="w-full">
              {profile.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <select name="dayOfWeek" required className="w-full">
              {DAYS.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
            <input name="startTime" type="time" required defaultValue="08:00" />
            <input name="endTime" type="time" required defaultValue="12:00" />
            <input
              name="slotMinutes"
              type="number"
              defaultValue={60}
              min={30}
              step={15}
              placeholder="Duração slot (min)"
            />
            <Button type="submit" variant="secondary">
              + Adicionar disponibilidade
            </Button>
          </form>
        ) : access.canWrite ? (
          <p className="mt-4 text-sm text-slate-400">
            Cadastre um local antes de definir disponibilidade.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
