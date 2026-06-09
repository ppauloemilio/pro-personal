import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, ChevronRight } from "lucide-react";

export type PersonalPickerItem = {
  vinculoId: string;
  personalName: string;
  categories: string[];
  locationNames: string[];
};

export function PersonalPicker({ vinculos }: { vinculos: PersonalPickerItem[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Escolha o personal</h2>
        <p className="mt-1 text-sm text-slate-400">
          Selecione com quem deseja agendar a aula.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {vinculos.map((vinculo) => (
          <Link key={vinculo.vinculoId} href={`/aluno/agendar?vinculoId=${vinculo.vinculoId}`}>
            <Card className="flex h-full items-center gap-4 transition hover:border-brand-500/40">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500/20">
                <User className="h-6 w-6 text-brand-400" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base">{vinculo.personalName}</CardTitle>
                {vinculo.categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {vinculo.categories.slice(0, 3).map((category) => (
                      <Badge key={category} variant="success">
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}
                {vinculo.locationNames.length > 0 && (
                  <p className="mt-2 truncate text-xs text-slate-500">
                    {vinculo.locationNames.join(" · ")}
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
