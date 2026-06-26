export type NavItemConfig = {
  href: string;
  label: string;
  icon: string;
};

export const personalNav: NavItemConfig[] = [
  { href: "/personal", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/personal/alunos", label: "Alunos", icon: "users" },
  { href: "/personal/agenda", label: "Agenda", icon: "calendar" },
  { href: "/personal/treinos", label: "Treinos", icon: "dumbbell" },
  { href: "/personal/chat", label: "Chat alunos", icon: "message-circle" },
  { href: "/personal/suporte", label: "Suporte", icon: "shield" },
  { href: "/personal/perfil", label: "Perfil", icon: "user" },
  { href: "/personal/assinatura", label: "Assinatura", icon: "credit-card" },
];

export const alunoNav: NavItemConfig[] = [
  { href: "/aluno", label: "Início", icon: "layout-dashboard" },
  { href: "/aluno/treino", label: "Treino", icon: "dumbbell" },
  { href: "/aluno/agendar", label: "Agendar", icon: "calendar" },
  { href: "/aluno/aulas", label: "Minhas aulas", icon: "book-open" },
  { href: "/aluno/chat", label: "Chat", icon: "message-circle" },
  { href: "/aluno/buscar-personal", label: "Buscar Personal", icon: "search" },
  { href: "/aluno/perfil", label: "Meu Perfil", icon: "user" },
  { href: "/aluno/suporte", label: "Suporte", icon: "shield" },
];

export const adminNav: NavItemConfig[] = [
  { href: "/admin", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/admin/personais", label: "Personais", icon: "users" },
  { href: "/admin/alunos", label: "Alunos", icon: "users" },
  { href: "/admin/vinculos", label: "Vínculos", icon: "link" },
  { href: "/admin/locais", label: "Locais", icon: "map-pin" },
  { href: "/admin/agenda", label: "Agenda", icon: "calendar" },
  { href: "/admin/categorias", label: "Categorias", icon: "tags" },
  { href: "/admin/chat", label: "Chat", icon: "message-circle" },
  { href: "/admin/configuracoes", label: "Configurações", icon: "settings" },
];
