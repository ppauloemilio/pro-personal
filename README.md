# Pro-Personal

Plataforma web para personal trainers presenciais e alunos: treinos, agenda multi-academia, chat, descoberta de personais, painel admin e assinatura por pacotes.

## Requisitos

- [Node.js](https://nodejs.org/) 20+ (inclui npm)
- Windows / macOS / Linux

## Instalação rápida (Windows)

**Duplo clique** em um destes arquivos na pasta do projeto:

| Arquivo | Uso |
|---------|-----|
| `iniciar.bat` | Modo produção (mais estável) — recomendado |
| `desenvolver.bat` | Modo desenvolvimento (hot reload) |

O navegador abrirá em **http://127.0.0.1:3000**

## Instalação manual

```bash
cd Personal
npm install
npm run setup
npm run build
npm run start
```

Ou em desenvolvimento: `npm run dev`

Abra [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Erro no PowerShell ("execução de scripts foi desabilitada")

No **PowerShell**, `npm` pode ser bloqueado. Use uma destas opções:

**Opção 1 (mais fácil):** duplo clique em `iniciar.bat` ou `desenvolver.bat`

**Opção 2 — no PowerShell:**
```powershell
npm.cmd run dev
```

**Opção 3 — no PowerShell:**
```powershell
cmd /c "npm run dev"
```

**Opção 4:** abra o **Prompt de Comando (CMD)** em vez do PowerShell e rode `npm run dev`.

**Teste se o servidor está no ar:** [http://127.0.0.1:3000/api/health](http://127.0.0.1:3000/api/health) deve retornar `{"ok":true}`.

## Contas demo (senha: `demo123`)

| Papel    | E-mail                 |
|----------|------------------------|
| Admin    | admin@propersonal.com  |
| Personal | personal@demo.com      |
| Personal | ana@demo.com           |
| Aluno    | aluno@demo.com         |

**Código de convite:** `DEMO2024`

## Funcionalidades

- **Personal:** dashboard, alunos, agenda (pré-reserva + aprovação), treinos, chat, perfil (locais, categorias), assinatura (Starter / Pro / Pro+), suporte admin
- **Aluno:** múltiplos personais, treino com comentários, agendar aulas, chat, descoberta
- **Admin:** personais, alunos, categorias, chat só com personais, bloqueio de contas

## Planos (personal)

| Alunos ativos | Mensalidade                          |
|---------------|--------------------------------------|
| 1–10          | R$ 20                                |
| 11–30         | R$ 50                                |
| 31+           | R$ 50 + R$ 1,50 × (alunos − 30)      |

Trial: 30 dias. Após expirar sem plano: **modo leitura** (sem novos vínculos, aprovações ou escrita).

## Stack

- Next.js 15 (App Router) + TypeScript
- Prisma + SQLite (dev)
- Tailwind CSS
- Autenticação JWT em cookie httpOnly

## Documentação

Escopo completo: [docs/ESCOPO-PRO-PERSONAL.md](docs/ESCOPO-PRO-PERSONAL.md)

## Produção

1. Troque `SESSION_SECRET` no `.env`
2. Use PostgreSQL: altere `provider` e `DATABASE_URL` em `prisma/schema.prisma`
3. `npm run build && npm run start`
