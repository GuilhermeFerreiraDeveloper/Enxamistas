# ENXAMISTAS — AUDITORIA COMPLETA DO PROJETO

**Data da Auditoria:** 24/11/2026  
**Documento de Referência:** `Enxamistas_Documento_Mestre_Requisitos_Completo.pdf` (10 páginas, Seções 1 a 39)  
**Modo de Execução:** Somente leitura e documentação (nenhum arquivo de código, dependência ou banco de dados foi alterado).

---

## 1. Resumo Executivo

O projeto **Enxamistas** é um monorepo npm workspaces (`apps/web`, `apps/api`, `packages/shared`) com uma base estrutural inicial aproveitável, mas atualmente **inoperante em ambiente local** e **muito distante do estado reportado em `docs/PROJECT_STATUS.md`**.

### Diagnóstico Geral
- **Pode ser recuperado sem reconstrução?** **Sim.** A estrutura do monorepo, a maior parte do schema Prisma (32 modelos definidos), o núcleo de autenticação (`Argon2` + `JWT` em cookie `HttpOnly`) e vários serviços de backend já existem e podem ser corrigidos e expandidos incrementalmente sem jogar o projeto fora.
- **Por que o projeto falha hoje no localhost (telas brancas e quebras):**
  1. **Tailwind CSS nunca é compilado** porque o arquivo `apps/web/postcss.config.js` **não existe**. O CSS gerado no build (`apps/web/.next/static/css/9dc2c1fbb5b94b06.css`) contém `@tailwind base; @tailwind components; @tailwind utilities;` e `@apply ...` crus, sem nenhuma classe utilitária gerada.
  2. **O comando `npm run dev` na raiz não sobe o frontend:** `npm run dev --workspaces --if-present` executa workspaces sequencialmente; `@enxamistas/api` (`nodemon`) trava a execução antes que `@enxamistas/web` (`next dev`) seja iniciado.
  3. **Loading infinito / tela vazia em rotas autenticadas:** Ao acessar `/dashboard` sem sessão ou com API/banco fora do ar, `(dashboard)/layout.tsx` exibe apenas uma `<div>` com spinner Tailwind que, sem CSS compilado, fica invisível sobre fundo escuro/branco ou preso se a chamada `/auth/me` falhar/demorar. Além disso, `LoginPage` e `RegisterPage` não atualizam o `AuthContext`.
  4. **Rotas internas e públicas quebradas (404 generalizado):** O Route Group `(dashboard)` não entra na URL (rotas reais: `/dashboard`, `/cursos`, `/feed`, `/membros`), mas a Sidebar e o Dashboard linkam para `/dashboard/cursos`, `/dashboard/feed`, `/dashboard/membros`, `/dashboard/eventos`, `/dashboard/medalhas`, `/dashboard/chat`, `/dashboard/atividades`. Na Home (`/`), os links gerados dinamicamente apontam para `/historia` e `/mansões` (ambos 404).
  5. **Pasta `apps/web/public/` vazia:** Todos os `<img src="/logos/Logo-2.png" />` quebram (os logos estão na raiz `/logos/`), assim como `/honeycomb-pattern.svg`.
  6. **Banco de dados e `.env` não configurados:** O arquivo `.env` tem hash SHA-256 idêntico ao `.env.example` (credenciais fictícias `user:password@localhost:5432`), não há PostgreSQL ativo na porta `5432`, e a pasta `apps/api/prisma/migrations/` **não existe**.
  7. **Build de produção da API quebrado:** `apps/api/tsconfig.json` gera `apps/api/dist/apps/api/src/index.js` em vez de `apps/api/dist/index.js`, quebrando `npm start` em `@enxamistas/api`.

### Verificação Compilação / Validação Executada (Somente Leitura)
- `packages/shared`: `tsc --noEmit` → **Passou (código 0)**.
- `apps/api`: `tsc --noEmit` → **Passou (código 0)** (embora o emit vá para caminho errado no `dist/`).
- `apps/web`: `tsc --noEmit` → **Passou (código 0)**.
- `apps/api/prisma/schema.prisma`: `npx prisma validate` → **Válido**.
- Testes automatizados: **Inexistentes (0 arquivos de teste)**.
- Repositório Git: **Não inicializado** (`.git` inexistente).

---

## 2. Confirmação de Leitura do PDF e Suas Seções

O arquivo `Enxamistas_Documento_Mestre_Requisitos_Completo.pdf` (10 páginas) foi localizado na raiz do workspace e lido **integralmente**, página por página:

- **Página 1:** Cabeçalho, Objetivo do documento, Nota de fidelidade e Instrução ao agente de IA.
- **Página 2:** Seção 1 (Visão geral e objetivo), Seção 2 (Stack tecnológica e hospedagem), Seção 3 (Organização de código / monorepo), Seção 4 (Identidade visual e experiência).
- **Página 3:** Seção 5 (Portal público e institucional), Seção 6 (Cadastro, login e autenticação), Seção 7 (Hierarquia de cargos e RBAC), Seção 8 (Perfil do membro), Seção 9 (Diretório privado de membros).
- **Página 4:** Seção 10 (Dashboard após login), Seção 11 (Sistema acadêmico — cursos, professores e horários, incluindo tabela completa do seed obrigatório de 18 disciplinas e 20 ocorrências semanais), Seção 12 (Eventos e calendário institucional - início).
- **Página 5:** Seção 12 (cont.), Seção 13 (Feed privado / comunidade), Seção 14 (Aulas, presença e comprovantes), Seção 15 (Conclusão de cursos e medalhas), Seção 16 (Chat privado em tempo real), Seção 17 (Rádio interna), Seção 18 (Galeria das mansões - início).
- **Página 6:** Seção 18 (cont.), Seção 19 (Conquistas/achievements), Seção 20 (Avisos institucionais), Seção 21 (Central de notificações), Seção 22 (Projetos dos membros), Seção 23 (Livro de visitas), Seção 24 (Enxamista do mês), Seção 25 (Painel administrativo - início).
- **Página 7:** Seção 25 (cont.), Seção 26 (Denúncias e moderação), Seção 27 (Privacidade e controle de acesso), Seção 28 (Banco de dados — modelos previstos), Seção 29 (API e arquitetura backend), Seção 30 (Storage / uploads).
- **Página 8:** Seção 31 (Segurança obrigatória), Seção 32 (Performance e UX), Seção 33 (Testes), Seção 34 (Documentação e deploy), Seção 35 (Roadmap / fases sugeridas 1–5).
- **Página 9:** Seção 35 (fases 6–12), Seção 36 (Regras de continuidade e proteção do workspace), Seção 37 (Checklist para auditoria do workspace - parte 1).
- **Página 10:** Seção 37 (Checklist - parte 2), Seção 38 (Critérios de conclusão do projeto), Seção 39 (Prompt de auditoria para o agente).

---

## 3. Arquitetura Real do Projeto

Atualmente o projeto implementa parcialmente uma arquitetura cliente-servidor separada em monorepo npm:

```
[Browser]
   │
   ▼  HTTP (porta 3000 planejada, Next.js 14 App Router)
[apps/web]  ── axios (withCredentials: true, NEXT_PUBLIC_API_URL || http://localhost:3001/api) ──▶ [apps/api]
   │                                                                                                 │
   │  (@enxamistas/shared: Zod schemas + UserRole + RoleHierarchy)                                   │ Prisma Client
   └─────────────────────────────────────────────────────────────────────────────────────────────────┴──▶ [PostgreSQL / Neon]
                                                                                                         (NÃO CONECTADO / SEM MIGRATIONS)
```

### Divergências Arquiteturais Observadas
1. **Comunicação em tempo real (Socket.IO):** Não há servidor WebSocket nem cliente Socket.IO instalados.
2. **Storage externo (S3):** Não há `StorageService` nem integração S3; variáveis `STORAGE_*` estão vazias e ignoradas em `apps/api/src/config/env.ts`.
3. **RBAC:** O schema usa apenas `enum UserRole` no modelo `User`, sem tabelas `roles`, `permissions`, `role_permissions` e `user_roles`.
4. **Rotas Next.js:** O uso do Route Group `(dashboard)` sem subpasta `dashboard/` causou divergência entre as URLs reais (`/cursos`, `/feed`, `/membros`) e os links de navegação (`/dashboard/cursos`, `/dashboard/feed`, `/dashboard/membros`).

---

## 4. Estrutura de Pastas

```text
Enxamistas/
├── .env                                # Idêntico ao .env.example (placeholders)
├── .env.example                        # Modelo de variáveis (falta NEXT_PUBLIC_API_URL)
├── .gitignore
├── Enxamistas_Documento_Mestre_Requisitos_Completo.pdf
├── README.md
├── package.json                        # Workspaces: apps/*, packages/*
├── package-lock.json
├── tsconfig.json                       # Config base com paths para @enxamistas/shared
├── docs/
│   └── PROJECT_STATUS.md               # Desatualizado/otimista frente ao estado real
├── logos/                              # Logos originais fora da pasta public do Next
│   ├── Logo-2.png
│   ├── Logo-6.png
│   └── Logo-texto-3.png
├── packages/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       ├── dist/
│       └── src/index.ts                # UserRole, RoleHierarchy e 6 schemas Zod
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── dist/                       # Estrutura errada: dist/apps/api/src/...
│   │   ├── prisma/
│   │   │   ├── schema.prisma           # 32 models + 1 enum (sem pasta migrations/)
│   │   │   └── seed.ts                 # Seed de 18 cursos e 20 horários (não idempotente)
│   │   └── src/
│   │       ├── app.ts                  # Express app + CORS + 7 routers + /health
│   │       ├── index.ts                # Listen na PORT
│   │       ├── config/env.ts           # Carrega .env da raiz
│   │       ├── lib/prisma.ts           # PrismaClient com log: ['query'] fixo
│   │       ├── middlewares/            # auth.middleware.ts, role.middleware.ts
│   │       ├── routes/                 # academic, auth, course, event, feed, medal, profile
│   │       ├── controllers/            # academic, auth, chat*, course, event, feed, medal, profile
│   │       ├── services/               # academic, audit*, auth, chat*, course, event, feed, medal, notification*, profile
│   │       └── utils/                  # PASTA VAZIA
│   └── web/
│       ├── next.config.js
│       ├── next-env.d.ts
│       ├── package.json
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       │   [AUSENTE: postcss.config.js]
│       ├── public/                     # PASTA COMPLETAMENTE VAZIA
│       └── src/
│           ├── styles/globals.css
│           ├── lib/
│           │   ├── api.ts
│           │   └── utils.ts
│           ├── contexts/
│           │   └── AuthContext.tsx
│           ├── components/
│           │   ├── Navbar.tsx          # Não importado em nenhuma página
│           │   └── ui/                 # Button.tsx, Input.tsx, Select.tsx
│           └── app/
│               ├── layout.tsx
│               ├── not-found.tsx
│               ├── page.tsx            # /
│               ├── cadastro/page.tsx   # /cadastro
│               ├── login/page.tsx      # /login
│               ├── lore/page.tsx       # /lore
│               ├── mansoes/page.tsx    # /mansoes
│               └── (dashboard)/
│                   ├── layout.tsx      # Layout compartilhado (sidebar + header)
│                   ├── dashboard/page.tsx # /dashboard
│                   ├── cursos/page.tsx    # /cursos
│                   ├── feed/page.tsx      # /feed
│                   └── membros/page.tsx   # /membros
```
*Obs.: Itens marcados com `*` no backend (`chat`, `audit`, `notification`) possuem código em `services/` (e `chat` em `controllers/`), porém não estão conectados em rotas nem em `app.ts`.*

---

## 5. Tecnologias Utilizadas

| Camada | Tecnologia | Versão (`package.json`) | Estado Real |
|---|---|---|---|
| Monorepo | npm workspaces | — | Configurado, porém `npm run dev` trava no 1º workspace |
| Frontend | Next.js (App Router) | `14.0.0` | Instalado; páginas básicas criadas com erros de rota/CSS |
| UI Library | React / React DOM | `^18.2.0` | Instalado |
| Estilização | Tailwind CSS / PostCSS / Autoprefixer | `^3.3.5` / `^8.4.31` / `^10.4.16` | **Quebrado** por ausência de `postcss.config.js` |
| Ícones | `lucide-react` | `^0.284.0` | Instalado e usado |
| Forms / Validação | `react-hook-form` + `@hookform/resolvers` + `zod` | `^7.47.0` / `^3.3.2` / `^3.22.0` | Instalado e usado em login/cadastro |
| HTTP Client | `axios` | `^1.6.0` | Instalado; falta interceptor de erro/timeout |
| Backend | Node.js + Express | `^4.18.2` | Instalado; 7 routers + `/health` |
| Auth / Hash | `argon2` + `jsonwebtoken` + `cookie-parser` | `^0.31.0` / `^9.0.1` / `^1.4.6` | Instalado e usado no módulo auth |
| ORM / DB | `prisma` + `@prisma/client` (PostgreSQL) | `^5.0.0` | Schema válido; sem migrations e sem DB conectado |
| Linguagem | TypeScript | `^5.0.0`–`5.2.2` | `tsc --noEmit` passa nos 3 pacotes; `build` da API sai no caminho errado |
| Tempo Real | Socket.IO | — | **Não instalado** |
| Storage | S3 / SDK | — | **Não instalado** |
| Testes | Jest / Vitest / Playwright | — | **Não instalado** |

---

## 6. Estado do Frontend

O frontend (`apps/web`) possui 9 páginas e 2 layouts, todos com falhas estruturais ou funcionais graves:

1. **CSS / Tailwind completamente inativo:** Sem `postcss.config.js`, o build em `apps/web/.next/static/css/9dc2c1fbb5b94b06.css` prova que `@tailwind` e `@apply` não foram compilados. Todo o layout visual quebra.
2. **Assets inexistentes (`apps/web/public/` vazio):** Imagens `/logos/Logo-2.png` e `/honeycomb-pattern.svg` retornam 404.
3. **Navegação quebrada:**
   - `(dashboard)/layout.tsx` aponta para `/dashboard/feed`, `/dashboard/cursos`, `/dashboard/membros` (todas dão 404 porque o Route Group `(dashboard)` não cria o prefixo `/dashboard/` na URL) e para `/dashboard/eventos`, `/dashboard/medalhas`, `/dashboard/chat`, `/termos`, `/privacidade` (páginas inexistentes).
   - `app/page.tsx` gera `/historia` (deveria ser `/lore`) e `/mansões` (deveria ser `/mansoes`).
   - `components/Navbar.tsx` nunca é importado.
4. **Integração incompleta / dados falsos:**
   - `dashboard/page.tsx` é 100% mockado (números, atividades, progresso e avisos fictícios), contrariando a Seção 10 do Documento Mestre.
   - `feed/page.tsx` só lista e cria post de texto; botões de curtida, comentário, mídia, menu e denúncia não têm ação (`onClick`).
   - `cursos/page.tsx` apenas lista cursos; botão `DETALHES` não faz nada.
   - `membros/page.tsx` apenas lista e filtra no cliente por texto; card de perfil detalhado não é clicável.
   - `mansoes/page.tsx` tem dados hardcoded, sem galeria/vídeo e botão `SOLICITAR CHAVE` inerte.
   - `login/page.tsx` e `cadastro/page.tsx` fazem `api.post` direto sem atualizar o `AuthContext`.
5. **Módulos ausentes no frontend:** Perfil individual e edição, Eventos, Calendário Acadêmico e Institucional, Aulas/Presenças/Comprovantes, Conclusões/Medalhas, Conquistas, Chat, Rádio, Galeria de Mansões real, Avisos, Notificações reais, Projetos, Livro de Visitas, Enxamista do Mês, Denúncias/Moderação e Painel Administrativo.

---

## 7. Estado do Backend

O backend (`apps/api`) possui boa organização inicial (`routes` → `controllers` → `services`), mas está incompleto e contém falhas críticas de segurança e build:

- **Montado em `apps/api/src/app.ts`:**
  - `GET /health`
  - `/api/auth` (`register`, `login`, `logout`, `me`)
  - `/api/profiles` (`getMe`, `updateMe`, `getMembers`, `getProfileByPassport`)
  - `/api/courses` (`getAllCourses`, `getTeachers`, `getCourseById`)
  - `/api/events` (`getAll`, `getById`, `rsvp`, `create`, `update`)
  - `/api/academic` (`enroll`, `getMyEnrollments`, `submitProof`, `createSession`, `getSessions`, `validateProof`)
  - `/api/medals` (`getMyMedals`, `getMyAchievements`, `createMedal`, `emitMedal`)
  - `/api/feed` (`getPosts`, `createPost`, `deletePost`, `likePost`, `unlikePost`, `addComment`, `report`)
- **Código existente porém desconectado (morto):**
  - `ChatController` e `ChatService`: sem arquivo de rotas e sem Socket.IO.
  - `NotificationService`: sem controller, sem rotas e nunca invocado pelos outros módulos.
  - `AuditService`: método estático `AuditService.log` nunca é chamado em nenhum lugar.
  - `AcademicService.addMaterial`, `EventService.deleteEvent`, `MedalService.createAchievement`, `MedalService.grantAchievement`: sem rotas/controllers expostos.
- **Inexistente no backend:**
  - Módulos de Admin, Roles/Permissions (RBAC dinâmico), Calendário Institucional, Conclusão de Cursos, Rádio, Galeria/Álbuns, Projetos, Livro de Visitas, Enxamista do Mês, Avisos, Denúncias/Moderação (gestão), Upload / `StorageService`, Rate Limiting, Helmet, Error Handler global e versionamento `/api/v1`.
- **Build quebrado:** `apps/api/tsconfig.json` não define `rootDir: "src"`, fazendo `npm run build` emitir em `apps/api/dist/apps/api/src/index.js` enquanto `package.json` aponta para `dist/index.js`.

---

## 8. Estado do Banco de Dados

- **Schema (`apps/api/prisma/schema.prisma`):**
  - Passa em `npx prisma validate`.
  - Contém `datasource db` com `url = env("DATABASE_URL")` e `directUrl = env("DIRECT_URL")` (preparado para Neon).
  - Contém 32 modelos e 1 enum (`UserRole`).
- **Problemas encontrados no Banco/Prisma:**
  1. **Nenhuma migration criada:** `apps/api/prisma/migrations/` não existe.
  2. **Conexão não configurada:** `.env` é idêntico ao `.env.example` (aponta para `localhost:5432` com usuário/senha padrão; nenhum PostgreSQL escutando na porta `5432`).
  3. **Modelos previstos no PDF ausentes no schema:**
     - Tabelas de RBAC extensível: `Role`, `Permission`, `RolePermission`, `UserRole` (hoje há apenas `enum UserRole`).
     - `CourseCompletion` (para registrar conclusões oficiais e critérios).
     - `NotificationPreference`.
     - Controle de suspensão/banimento em `User` (ex.: `status`, `isSuspended`, `suspendedAt`, `suspendedReason`).
     - Campos faltantes em modelos existentes: `Event.attractions`, `MonthlyHighlight.description` / `contributions` (e `MonthlyHighlight` tem `@@unique([month, year])` em vez de considerar regra por membro/mês), `CourseMedal.criteria` / `emittedBy`, `Achievement.criteria`.
  4. **Seed (`apps/api/prisma/seed.ts`):**
     - Contém exatamente as 18 disciplinas e 20 ocorrências de aula descritas na Seção 11 do PDF.
     - **Bug:** Cria `ClassSchedule` com `create()` sem verificar duplicidade; rodar `seed` mais de uma vez duplica todos os horários. Não cria usuário administrador inicial nem settings.
  5. **Performance:** `apps/api/src/lib/prisma.ts` força `log: ['query']` inclusive em produção, degradando performance e podendo vazar dados em logs.

---

## 9. Estado da Autenticação

- **Backend:**
  - `AuthService.register`: verifica duplicidade de `passport`, gera hash com `argon2.hash`, cria `User` (role default `CONVIDADO`) e `Profile` com `name` e `mainCourseId`. Retorna JWT assinado com `7d`.
  - `AuthService.login`: busca `User` por `passport`, valida senha com `argon2.verify`.
  - `AuthController`: grava JWT em cookie `token` (`httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `maxAge: 7d`).
  - `authMiddleware`: lê `req.cookies.token`, valida JWT e busca `user` + `profile` no Prisma.
- **Falhas críticas:**
  1. **Não verifica usuário suspenso/banido** (nem existe campo no banco).
  2. **Secret inseguro por fallback:** `apps/api/src/config/env.ts` usa `process.env.JWT_SECRET || 'default-secret'`.
  3. **Cadastro não cria `CourseEnrollment` nem valida `mainCourseId`:** Se `mainCourseId` não existir no banco, o Prisma explode erro de chave estrangeira e o controller devolve a mensagem bruta para o cliente.
  4. **Frontend `AuthContext` dessincronizado e proteção falha:**
     - `LoginPage` e `RegisterPage` não chamam `useAuth().login()` e não atualizam `user` no contexto.
     - `AuthContext` só verifica `pathname.startsWith('/dashboard')`, deixando `/cursos`, `/feed` e `/membros` acessíveis sem redirect.
     - `checkUser()` roda somente na montagem inicial (`useEffect(..., [])`), não revalidando na troca de rota.
     - Em produção cross-domain (Vercel ↔ Render), `sameSite: 'lax'` bloqueará o envio do cookie entre domínios diferentes (exigirá `sameSite: 'none'; secure: true` ou proxy reverso).

---

## 10. Lista de Rotas e Estado de Cada Uma

### 10.1 Rotas Frontend (`apps/web`)

| Rota Real | Arquivo | Rota Linkada na UI | Estado Atual | Observações |
|---|---|---|---|---|
| `/` | `src/app/page.tsx` | `/` | **Com Erros Visuais / Links Quebrados** | Sem Tailwind compilado, logo 404, links para `/historia` e `/mansões` (404), redes sociais inertes. |
| `/lore` | `src/app/lore/page.tsx` | `/lore` (e `/historia` quebrado na nav) | **Com Erros Visuais / Estática** | Sem Tailwind compilado, logo 404, conteúdo hardcoded (sem CMS/edição). |
| `/mansoes` | `src/app/mansoes/page.tsx` | `/mansões` (quebrado na nav) | **Com Erros Visuais / Parcial** | Sem Tailwind, logo 404, sem fotos/vídeos/galeria/lightbox, botão `SOLICITAR CHAVE` inerte. |
| `/login` | `src/app/login/page.tsx` | `/login` | **Com Erros** | Sem Tailwind, logo 404, não atualiza `AuthContext`, depende de API/DB. |
| `/cadastro` | `src/app/cadastro/page.tsx` | `/cadastro` | **Com Erros** | Sem Tailwind, logo 404, não atualiza `AuthContext`, select de cursos fica vazio sem API/DB. |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | `/dashboard` | **Com Erros / Dados Mockados** | Sem Tailwind, loading travado/invisível sem API, cards e atividades 100% hardcoded, links para `/dashboard/cursos`, `/dashboard/atividades`, `/dashboard/medalhas` dão 404. |
| `/cursos` | `src/app/(dashboard)/cursos/page.tsx` | `/dashboard/cursos` (404!) | **Com Erros / Parcial** | Rota real `/cursos` não bate com Sidebar (`/dashboard/cursos`). Sem proteção de rota, botão `DETALHES` inerte. |
| `/feed` | `src/app/(dashboard)/feed/page.tsx` | `/dashboard/feed` (404!) | **Com Erros / Parcial** | Rota real `/feed` não bate com Sidebar (`/dashboard/feed`). Só cria post de texto; like/comentário/mídia/menu/denúncia inertes. |
| `/membros` | `src/app/(dashboard)/membros/page.tsx` | `/dashboard/membros` (404!) | **Com Erros / Parcial** | Rota real `/membros` não bate com Sidebar (`/dashboard/membros`). Sem filtros avançados, paginação ou página individual. |
| `/dashboard/eventos` | *Inexistente* | Sidebar | **404 (Não Implementada)** | — |
| `/dashboard/medalhas` | *Inexistente* | Sidebar / Dashboard | **404 (Não Implementada)** | — |
| `/dashboard/chat` | *Inexistente* | Sidebar | **404 (Não Implementada)** | — |
| `/dashboard/atividades` | *Inexistente* | Dashboard | **404 (Não Implementada)** | — |
| `/perfil` ou `/membros/[passport]` | *Inexistente* | — | **Não Implementada** | — |
| `/admin` | *Inexistente* | — | **Não Implementada** | — |
| `/termos`, `/privacidade` | *Inexistente* | Footer do Dashboard | **404 (Não Implementada)** | — |

### 10.2 Rotas Backend (`apps/api`)

| Prefixo / Rota | Arquivo | Auth / RBAC | Estado Real |
|---|---|---|---|
| `GET /health` | `src/app.ts` | Público | Implementado (não verifica conexão real com Prisma/DB). |
| `POST /api/auth/register` | `src/routes/auth.routes.ts` | Público | Parcial (não valida `mainCourseId`, não cria `CourseEnrollment`, sem rate limit). |
| `POST /api/auth/login` | `src/routes/auth.routes.ts` | Público | Parcial (não bloqueia suspensos, sem brute-force/rate limit). |
| `POST /api/auth/logout` | `src/routes/auth.routes.ts` | Público | Implementado (não auditado). |
| `GET /api/auth/me` | `src/routes/auth.routes.ts` | `authMiddleware` | Implementado (não verifica suspensão). |
| `GET /api/profiles/me` | `src/routes/profile.routes.ts` | `authMiddleware` | Implementado (não retorna cursos secundários/medalhas/conquistas). |
| `PUT /api/profiles/me` | `src/routes/profile.routes.ts` | `authMiddleware` | Parcial (sem validação Zod, não atualiza avatar). |
| `GET /api/profiles/members` | `src/routes/profile.routes.ts` | `authMiddleware` | Parcial (sem paginação, sem filtro por medalhas/conclusões). |
| `GET /api/profiles/:passport` | `src/routes/profile.routes.ts` | `authMiddleware` | **Com erro lógico** (usa `contains` em vez de igualdade exata no passaporte). |
| `GET /api/courses`, `/:id`, `/teachers` | `src/routes/course.routes.ts` | Público | Implementado (não retorna materiais/aulas). |
| `GET /api/events`, `/:id` | `src/routes/event.routes.ts` | `authMiddleware` | Parcial (bloqueia visualização de eventos `PUBLIC` sem login). |
| `POST /api/events/:id/rsvp` | `src/routes/event.routes.ts` | `authMiddleware` | Parcial (sem transação, não checa status CANCELLED/data passada, sem notificação). |
| `POST /api/events`, `PUT /api/events/:id` | `src/routes/event.routes.ts` | `ABELHA_PRINCESA+` | Parcial (`PUT` sem Zod; `deleteEvent` sem rota; sem notificações). |
| `POST /api/academic/enroll`, `GET /my-enrollments` | `src/routes/academic.routes.ts` | `authMiddleware` | Parcial (sem validação Zod, erro 400 genérico em duplicidade). |
| `POST /api/academic/courses/:courseId/sessions` | `src/routes/academic.routes.ts` | **Só `authMiddleware`!** | **Falha crítica de segurança** (qualquer `CONVIDADO` cria aula). |
| `GET /api/academic/courses/:courseId/sessions` | `src/routes/academic.routes.ts` | `authMiddleware` | **Falha de privacidade** (expõe comprovantes de todos os alunos). |
| `POST /api/academic/proofs` | `src/routes/academic.routes.ts` | `authMiddleware` | Parcial (aceita apenas URL externa, sem upload S3). |
| `POST /api/academic/proofs/:proofId/validate` | `src/routes/academic.routes.ts` | **Só `authMiddleware`!** | **Falha crítica de segurança** (qualquer `CONVIDADO` valida o próprio comprovante). |
| `GET /api/medals/my`, `/my-achievements` | `src/routes/medal.routes.ts` | `authMiddleware` | Parcial (lógica básica sem fluxo de conclusão de curso). |
| `POST /api/medals/emit`, `/courses/:courseId` | `src/routes/medal.routes.ts` | `ABELHA_PRINCESA+` | Parcial (sem auditoria, sem notificação, sem Zod). |
| `GET / POST / DELETE /api/feed` | `src/routes/feed.routes.ts` | `authMiddleware` | Parcial (não retorna comentários; sem edição de post; `deletePost` ignora Rainha/Princesa). |
| `POST / DELETE /api/feed/:postId/like` | `src/routes/feed.routes.ts` | `authMiddleware` | Implementado na API (sem botão conectado no front). |
| `POST /api/feed/:postId/comments`, `/report` | `src/routes/feed.routes.ts` | `authMiddleware` | Parcial (sem editar/excluir/curtir comentário, sem validação em `report`, sem gestão de denúncias). |
| `/api/chat/*` | *Não montado* | — | Controller/Service existem sem rotas; falta checagem de participante (IDOR) e Socket.IO. |
| `/api/admin`, `/roles`, `/announcements`, `/notifications`, `/radio`, `/gallery`, `/projects`, `/guestbook`, `/highlights`, `/uploads` | *Inexistentes* | — | **Não implementados**. |

---

## 11. Checklist Completo dos Requisitos do Documento Mestre

Classificação adotada conforme solicitado:
- **IMPLEMENTADO E VERIFICADO**
- **PARCIALMENTE IMPLEMENTADO**
- **IMPLEMENTADO, MAS COM ERROS**
- **NÃO IMPLEMENTADO**
- **NÃO VERIFICADO** *(aplicável onde há código mas a execução ponta-a-ponta com DB real não pôde ocorrer)*

| # | Requisito (PDF Seções 1–38 / Tabela Seção 37) | Classificação | Evidência Concreta | Observação / Próxima Ação |
|---|---|---|---|---|
| 1 | Monorepo / workspace (`apps/web`, `apps/api`, `packages/shared`, `docs/`) | **IMPLEMENTADO, MAS COM ERROS** | `package.json`, `tsconfig.json` | `npm run dev` trava no 1º workspace; `apps/api` builda no caminho errado em `dist/`. |
| 2 | Frontend Next.js / React / TypeScript (App Router) | **IMPLEMENTADO, MAS COM ERROS** | `apps/web/package.json`, `tsc --noEmit` OK | Páginas existem, porém rotas quebradas por `(dashboard)` e sem `postcss.config.js`. |
| 3 | Tailwind / identidade visual (paleta dark/gold, logos, responsividade) | **IMPLEMENTADO, MAS COM ERROS** | `apps/web/tailwind.config.ts`, `src/styles/globals.css`, `apps/web/.next/static/css/9dc2c1fbb5b94b06.css` | Falta `postcss.config.js` (Tailwind 0% compilado) e `apps/web/public/` está vazio. |
| 4 | Backend Express / TypeScript (módulos, DTOs, errors, versioning) | **PARCIALMENTE IMPLEMENTADO** | `apps/api/src/app.ts`, 7 routers, 8 controllers, 10 services | Falta versionamento, `StorageService`, error handler, validators, e 8+ módulos. |
| 5 | Integração Frontend ↔ API | **IMPLEMENTADO, MAS COM ERROS** | `apps/web/src/lib/api.ts`, `AuthContext.tsx` | Sem API/DB ativos; `Login`/`Cadastro` ignoram `AuthContext`; Dashboard usa mocks. |
| 6 | PostgreSQL / Neon (conexão, índices, eficiência) | **NÃO VERIFICADO** | `apps/api/prisma/schema.prisma`, `.env` | `.env` igual ao `.env.example`; sem PostgreSQL/Neon conectado. `prisma.ts` loga toda query. |
| 7 | Prisma / migrations / seed | **IMPLEMENTADO, MAS COM ERROS** | `schema.prisma` válido, `seed.ts` com 18 cursos / 20 horários | Zero arquivos em `migrations/`; `seed.ts` duplica `ClassSchedule` se rodado novamente. |
| 8 | Env e secrets (`.env.example`, validação no startup) | **IMPLEMENTADO, MAS COM ERROS** | `.env.example`, `apps/api/src/config/env.ts` | `JWT_SECRET` tem fallback `'default-secret'`; `NEXT_PUBLIC_API_URL` ausente do `.env.example`; `STORAGE_*` não validados. |
| 9 | Health check (`/health`) | **PARCIALMENTE IMPLEMENTADO** | `apps/api/src/app.ts` L33-35 | Retorna `200 OK` estático sem checar conectividade com o banco. |
| 10 | Portal público / Home | **IMPLEMENTADO, MAS COM ERROS** | `apps/web/src/app/page.tsx` | Links quebrados (`/historia`, `/mansões`), sem cursos/eventos/projetos, sem CSS compilado. |
| 11 | História e Lore | **PARCIALMENTE IMPLEMENTADO** | `apps/web/src/app/lore/page.tsx` | Conteúdo estático básico; faltam objetivos/evolução/tradições e preparo para edição admin. |
| 12 | Cadastro / Login | **IMPLEMENTADO, MAS COM ERROS** | `auth.service.ts`, `auth.controller.ts`, `login/page.tsx`, `cadastro/page.tsx` | Falta atualizar `AuthContext`, validar `mainCourseId`, criar matrícula inicial, rate limit e checar suspensos. |
| 13 | Passaporte único / segurança de sessão | **PARCIALMENTE IMPLEMENTADO** | `schema.prisma` (`@unique`), `argon2`, `HttpOnly` cookie | Falta proteção brute-force, rate limit, `sameSite` para cross-origin prod, sanitização de erros. |
| 14 | Curso principal obrigatório | **IMPLEMENTADO, MAS COM ERROS** | `packages/shared/src/index.ts` L30, `auth.service.ts` L26 | Exigido no Zod, mas `auth.service.ts` não valida se o ID existe e não cria `CourseEnrollment(MAIN)`. |
| 15 | Cargo padrão `CONVIDADO` | **PARCIALMENTE IMPLEMENTADO** | `schema.prisma` L26 (`@default(CONVIDADO)`) | Definido no schema; não testado contra banco real. |
| 16 | Hierarquia de cargos e RBAC extensível | **PARCIALMENTE IMPLEMENTADO** | `RoleHierarchy` em `shared`, `role.middleware.ts` | Faltam tabelas `roles`, `permissions`, `role_permissions`, `user_roles`, auditoria e endpoints de gestão. |
| 17 | Perfis / edição autorizada | **PARCIALMENTE IMPLEMENTADO** | `profile.routes.ts`, `profile.service.ts` | Sem validação Zod, bug `contains` em `/:passport`, zero telas de perfil no frontend. |
| 18 | Diretório privado de membros | **PARCIALMENTE IMPLEMENTADO** | `profile.service.ts` (`getMembers`), `(dashboard)/membros/page.tsx` | Falta proteção da rota `/membros`, paginação, filtros (medalhas/conclusões) e página do perfil. |
| 19 | Dashboard após login | **IMPLEMENTADO, MAS COM ERROS** | `apps/web/src/app/(dashboard)/dashboard/page.tsx` | 100% dados mockados/hardcoded; todos os links internos levam a 404. |
| 20 | Cursos / professores / horários | **PARCIALMENTE IMPLEMENTADO** | `course.service.ts`, `seed.ts`, `(dashboard)/cursos/page.tsx` | Backend básico OK; no front falta página do curso, catálogo público, matrícula e detalhes funcionais. |
| 21 | Calendário acadêmico | **NÃO IMPLEMENTADO** | — | Não há view de calendário exibindo curso principal e secundários. |
| 22 | Feed / posts / comentários / likes | **PARCIALMENTE IMPLEMENTADO** | `feed.service.ts`, `(dashboard)/feed/page.tsx` | Front só cria/lista texto; curtir, comentar, responder, editar/excluir e upload de mídia não funcionam. |
| 23 | Denúncias / moderação | **PARCIALMENTE IMPLEMENTADO** | `Report` no Prisma, `POST /api/feed/report` | Sem listagem/análise/resolução no backend, sem painel de moderação e botão de denúncia inerte no front. |
| 24 | Eventos / inscrições / limites | **PARCIALMENTE IMPLEMENTADO** | `event.service.ts`, `event.controller.ts` | Falta suporte público para `PUBLIC`, validações de cancelamento/data, notificações e 100% da UI. |
| 25 | Calendário institucional | **NÃO IMPLEMENTADO** | — | Sem modelo/API/UI separados do acadêmico (visões mensal, semanal, lista). |
| 26 | Aulas / presenças / materiais | **IMPLEMENTADO, MAS COM ERROS** | `academic.service.ts`, `academic.routes.ts` | Falha crítica: qualquer usuário cria sessão e valida comprovante; `addMaterial` sem rota; sem UI. |
| 27 | Upload comprovantes / Ctrl+V / drag-drop | **NÃO IMPLEMENTADO** | `proofSchema` (apenas URL string) | Sem componente de upload, preview, Ctrl+V, drag-and-drop ou multipart API. |
| 28 | Validação / recusa com motivo | **IMPLEMENTADO, MAS COM ERROS** | `academic.service.ts` (`validateProof`) | Endpoint sem `roleMiddleware` (inseguro) e sem interface no frontend. |
| 29 | Conclusão de cursos / medalhas | **PARCIALMENTE IMPLEMENTADO** | `medal.service.ts`, `CourseMedal`, `UserMedal` | Falta model `CourseCompletion`, critérios automáticos/manuais, fluxo oficial e UI. |
| 30 | Chat / Socket.IO / persistência | **PARCIALMENTE IMPLEMENTADO** | `chat.service.ts`, `chat.controller.ts`, modelos Prisma | Rotas não montadas em `app.ts`, falha IDOR sem checar membro, zero Socket.IO e zero UI. |
| 31 | Rádio / playlists / player | **PARCIALMENTE IMPLEMENTADO** | Modelos `RadioTrack`, `RadioPlaylist`, `RadioPlaylistTrack` | Apenas no schema Prisma; 0% no backend e frontend. |
| 32 | Galeria mansões (sem 3D, lightbox, álbuns) | **PARCIALMENTE IMPLEMENTADO** | `Album`/`AlbumMedia` no Prisma, `mansoes/page.tsx` | Backend 0%; página `/mansoes` hardcoded sem imagens, vídeos, álbuns ou lightbox. |
| 33 | Conquistas (achievements) | **PARCIALMENTE IMPLEMENTADO** | `Achievement`/`UserAchievement`, `MedalService` | Só consulta `my-achievements`; criação/concessão sem rotas; zero regras automáticas e zero UI. |
| 34 | Avisos institucionais | **PARCIALMENTE IMPLEMENTADO** | Model `Announcement` no Prisma | 0% no backend; no front há um aviso falso hardcoded no Dashboard. |
| 35 | Central de notificações | **PARCIALMENTE IMPLEMENTADO** | Model `Notification`, `NotificationService` | Service órfão sem rotas/eventos; falta `NotificationPreferences`; sino no front é estático. |
| 36 | Projetos dos membros | **PARCIALMENTE IMPLEMENTADO** | Model `Project` no Prisma | Apenas no schema Prisma; 0% no backend e frontend. |
| 37 | Livro de visitas | **PARCIALMENTE IMPLEMENTADO** | Model `GuestbookEntry` no Prisma | Apenas no schema Prisma; 0% no backend e frontend. |
| 38 | Enxamista do mês | **PARCIALMENTE IMPLEMENTADO** | Model `MonthlyHighlight` no Prisma | Apenas no schema (faltam campos `description`/`contributions`); 0% backend e front. |
| 39 | Painel administrativo | **NÃO IMPLEMENTADO** | — | Zero rotas `/api/admin` e zero telas administrativas. |
| 40 | Storage externo (S3 / `StorageService`) | **NÃO IMPLEMENTADO** | `.env.example` (`STORAGE_*`) | Nenhuma abstração `StorageService`, nenhum SDK, nenhuma validação de upload. |
| 41 | Audit logs | **PARCIALMENTE IMPLEMENTADO** | Model `AuditLog`, `AuditService.log` | `AuditService` nunca é chamado em lugar nenhum e não há consulta de logs. |
| 42 | Segurança / privacidade | **IMPLEMENTADO, MAS COM ERROS** | `argon2`, `HttpOnly`, `cors` | Múltiplas brechas: RBAC faltando em `academic`, IDOR em `chat`, fallback `default-secret`, sem rate limit, sem suspensão. |
| 43 | Performance / responsividade | **IMPLEMENTADO, MAS COM ERROS** | Sidebar responsiva no código, paginação em feed/chat | Responsividade anulada pela falta do Tailwind; `getMembers` sem paginação; `prisma.ts` loga todas as queries. |
| 44 | Testes | **NÃO IMPLEMENTADO** | — | 0 testes unitários, integração ou E2E. |
| 45 | README / documentação | **PARCIALMENTE IMPLEMENTADO** | `README.md`, `docs/PROJECT_STATUS.md` | `README.md` cita recursos inexistentes (rate limit); `PROJECT_STATUS.md` está desalinhado da realidade. |
| 46 | Build | **IMPLEMENTADO, MAS COM ERROS** | `apps/web/.next`, `apps/api/dist` | `apps/web` gera CSS sem Tailwind; `apps/api` builda em `dist/apps/api/src/index.js` quebrando `npm start`. |
| 47 | Deploy Vercel / Render / Neon | **NÃO IMPLEMENTADO** | `schema.prisma` (`directUrl`) | Nenhum deploy executado nem documentado; sem arquivos/guias de deploy. |
| 48 | `docs/PROJECT_STATUS.md` | **IMPLEMENTADO, MAS COM ERROS** | `docs/PROJECT_STATUS.md` | Marca módulos quebrados/mockados (Dashboard, Feed, Cursos, Membros, Design System) como `[x] Concluídos`. |

---

## 12. Funcionalidades Implementadas e Verificadas

No estado atual do workspace, **nenhuma funcionalidade de ponta a ponta (Frontend + API + Persistência + UI funcional)** pode ser classificada como `IMPLEMENTADO E VERIFICADO`, pelos seguintes fatos comprovados:
1. O banco de dados PostgreSQL/Neon não está conectado (`.env` contém placeholders do `.env.example` e não há `migrations/`).
2. O frontend não compila Tailwind CSS (ausência de `postcss.config.js`).
3. Não há suíte de testes automatizados.

O que está mais próximo de funcional em nível de código isolado (após configurar DB/Tailwind):
- **Typechecking estático** (`tsc --noEmit` passa em `shared`, `api`, `web`) e **validação sintática do Prisma** (`prisma validate` passa).
- **Esqueleto de Autenticação no Backend** (`argon2` + JWT cookie `HttpOnly` + `authMiddleware`).
- **Listagem de cursos e professores no Backend** (`GET /api/courses`, `GET /api/courses/teachers`).

---

## 13. Funcionalidades Parcialmente Implementadas

- **Autenticação & Cadastro:** Backend cria usuário/perfil e autentica cookie, mas não valida `mainCourseId`, não cria `CourseEnrollment`, não suporta suspensão e não tem rate limit; frontend não sincroniza o `AuthContext`.
- **Perfil & Diretório de Membros:** Backend lista membros (`GET /api/profiles/members`) e atualiza bio/música/interesses (`PUT /api/profiles/me`), mas sem paginação, sem filtros por medalha/curso concluído, sem atualização de avatar, com bug `contains` em `/:passport`, e sem tela de perfil no front.
- **Feed Social:** Backend tem listagem, criação, delete, like/unlike, comentário e report; no front apenas listagem e criação de texto funcionam. Faltam likes interativos, comentários/respostas visíveis e editáveis, edição de post, mídia e moderação.
- **Cursos / Sistema Acadêmico:** Seed obrigatório presente (com bug de duplicação), listagem funciona na API e consome no front (`/cursos`), mas detalhes, matrícula, calendário acadêmico, materiais, presença e conclusão estão ausentes no front ou inseguros no backend.
- **Eventos:** CRUD básico + RSVP existem no backend (com falhas em eventos públicos e notificações), 0% no frontend.
- **Medalhas & Conquistas:** Serviços e tabelas básicos no backend, sem fluxo de conclusão de curso e 0% no frontend.
- **Chat Privado:** Service e Controller escritos, mas sem rotas no Express, com falha IDOR, sem Socket.IO e 0% no frontend.
- **Notificações & Auditoria:** Serviços isolados (`NotificationService`, `AuditService`) escritos no backend, porém nunca chamados e sem rotas/UI.
- **Portal Institucional (Home, Lore, Mansões):** Páginas existem visualmente no código, mas sem CSS compilado, sem imagens, com links quebrados e dados estáticos.

---

## 14. Funcionalidades Quebradas

1. **Compilação de Estilos (Tailwind CSS):** Quebrada em todo o frontend pela falta de `apps/web/postcss.config.js`.
2. **Inicialização Unificada (`npm run dev`):** Quebrada pelo comportamento sequencial do `npm --workspaces` (bloqueia em `@enxamistas/api`).
3. **Build de Produção da API (`npm run build` + `npm start`):** `dist/index.js` não é gerado no local esperado por `apps/api/package.json`.
4. **Navegação da Sidebar, Dashboard e Home:** Múltiplos links para `/dashboard/cursos`, `/dashboard/feed`, `/dashboard/membros`, `/dashboard/eventos`, `/dashboard/medalhas`, `/dashboard/chat`, `/dashboard/atividades`, `/historia`, `/mansões`, `/termos`, `/privacidade` levam à página 404 (`not-found.tsx`).
5. **Logos e Assets Públicos:** Todos os `<img src="/logos/Logo-2.png">` quebram porque `apps/web/public/` está vazio.
6. **Segurança das Rotas Acadêmicas (`apps/api/src/routes/academic.routes.ts`):** Criação de aulas e validação de comprovantes estão abertas a qualquer usuário autenticado (`CONVIDADO`).
7. **Fluxo Pós-Login / Pós-Cadastro no Frontend:** `LoginPage` e `RegisterPage` redirecionam para `/dashboard` sem atualizar o estado do `AuthContext`.
8. **Dashboard (`apps/web/src/app/(dashboard)/dashboard/page.tsx`):** Exibe dados falsos/hardcoded em vez de dados reais.
9. **Seed de Horários (`apps/api/prisma/seed.ts`):** Duplica todos os 20 `ClassSchedule` a cada execução.

---

## 15. Funcionalidades Ainda Não Desenvolvidas

- **StorageService / Upload de Arquivos S3** (avatares, capas, mídia do feed, materiais, comprovantes privados com Ctrl+V / drag-and-drop).
- **Chat em Tempo Real com Socket.IO** (handshake autenticado, salas, reconexão, unread count, busca, UI).
- **Painel Administrativo Completo** (métricas, gestão de membros, suspensão/reativação, atribuição de cargos auditada, gestão de eventos/acadêmico/medalhas/conquistas/avisos/configurações/logs).
- **RBAC Dinâmico e Extensível** (`roles`, `permissions`, `role_permissions`, `user_roles` + interface de gestão).
- **Conclusão Oficial de Cursos** (critérios automáticos/manuais, validação, preservação de histórico).
- **Calendário Acadêmico e Calendário Institucional** (visões mensal, semanal, lista).
- **Eventos no Frontend** (listagem pública e privada, detalhes, RSVP, criação/gestão).
- **Sistema de Aulas, Presenças e Comprovantes no Frontend**.
- **Rádio Interna** (player persistente entre rotas, playlists, biblioteca, favoritos).
- **Galeria Real das Mansões** (fotos, categorias de ambientes, vídeo/tour, álbuns, lightbox).
- **Avisos Institucionais** (backend + exibição real no Dashboard).
- **Central de Notificações Real** (backend + Socket.IO + dropdown/página no frontend + preferências).
- **Projetos dos Membros** (backend + listagem/busca/página individual).
- **Livro de Visitas** (backend + moderação + anti-spam + UI).
- **Enxamista do Mês** (backend + destaque no Dashboard + histórico).
- **Painel de Denúncias e Moderação** (workflow `PENDING → ANALYZING → RESOLVED → REJECTED`).
- **Página de Perfil do Membro e Edição** (`/perfil` e `/membros/[passport]`).
- **Suíte de Testes** (unitários, integração e E2E).

---

## 16. Problemas Que Causam Tela Branca

Esta seção consolida todas as causas técnicas reais para o sintoma de páginas completamente brancas/vazias no `localhost`:

### Causa 1 — **Ausência de `apps/web/postcss.config.js` (Gravidade: CRÍTICA)**
- **Evidência:** `apps/web/postcss.config.js` não existe. O arquivo CSS compilado em `apps/web/.next/static/css/9dc2c1fbb5b94b06.css` contém literalmente `@tailwind base;@tailwind components;@tailwind utilities;` e `@apply ...`.
- **Causa provável:** O arquivo de configuração do PostCSS nunca foi criado ou foi removido durante o setup/redesign.
- **Consequência:** Zero classes utilitárias Tailwind (`bg-obsidian`, `text-white`, `min-h-screen`, `flex`, `grid`, `hidden`, `w-*`, `h-*`) chegam ao browser. O layout colapsa, fundos escuros somem ou ficam desalinhados, componentes `hidden` aparecem soltos, texto branco sobre fallback branco desaparece e o spinner de carregamento não tem tamanho nem visibilidade.
- **Correção recomendada:** Criar `apps/web/postcss.config.js` configurando `tailwindcss` e `autoprefixer`, e remover `@apply` problemático ou validar o CSS gerado via `next build`.

### Causa 2 — **Estado de Loading Infinito / Spinner Invisível no `(dashboard)/layout.tsx` (Gravidade: CRÍTICA)**
- **Arquivo:** `apps/web/src/app/(dashboard)/layout.tsx` (L47-53) e `apps/web/src/contexts/AuthContext.tsx` (L37-50).
- **Evidência:** Enquanto `loading === true`, o layout renderiza somente `<div className="min-h-screen bg-obsidian flex items-center justify-center"><div className="w-12 h-12 ... animate-spin" /></div>`. Sem Tailwind compilado, esse elemento tem **altura 0 e nenhum conteúdo textual/visível** → tela completamente vazia. Além disso, `apps/web/src/lib/api.ts` cria o `axios` sem `timeout`; se a API não estiver rodando (ou travada por `npm run dev` / DB), ou se o redirect demorar, a interface trava nesse estado vazio.
- **Correção recomendada:** Definir `timeout` no `api.ts`, garantir fallback visual no loading sem depender apenas de classes utilitárias frágeis, e revisar o ciclo de `checkUser` no `AuthContext`.

### Causa 3 — **Acesso ao `/dashboard` com `npm run dev` na raiz (Frontend nunca sobe) ou com API offline (Gravidade: CRÍTICA)**
- **Arquivo:** `package.json` (raiz, L5).
- **Evidência:** `"dev": "npm run dev --workspaces --if-present"` bloqueia no primeiro workspace (`@enxamistas/api`).
- **Correção recomendada:** Usar `concurrently` (ou scripts explícitos separados) para rodar API e Web simultaneamente.

### Causa 4 — **Risco de Crash Client-Side (`TypeError`) no `DashboardLayout` e `DashboardPage` (Gravidade: ALTA)**
- **Arquivos:** `apps/web/src/app/(dashboard)/layout.tsx` (L142, L160, L232) e `apps/web/src/app/(dashboard)/dashboard/page.tsx` (L42).
- **Evidência:** Expressões como `{user?.profile.name[0]}` e `{user?.profile.name.split(' ')[0]}` assumem que se `user` existir, `user.profile` e `user.profile.name` sempre serão não-nulos. Também não há nenhum `error.tsx` ou `global-error.tsx` no App Router; qualquer exceção client-side gera tela de erro branca/genérica do Next.js.
- **Correção recomendada:** Usar optional chaining completo (`user?.profile?.name?.[0] ?? '?'`) e adicionar `error.tsx` no app.

### Causa 5 — **Rotas 404 ao navegar pela Sidebar, Dashboard ou Home (Gravidade: ALTA)**
- **Evidência:** Navegar para `/dashboard/cursos`, `/dashboard/feed`, `/dashboard/membros`, `/historia`, `/mansões`, etc. cai em `not-found.tsx` (que sem Tailwind também renderiza completamente quebrada/desalinhada).

---

## 17. Problemas de UI/UX

1. **Quebra total do Design System em runtime:** Sem `postcss.config.js`, a estética dark/gold/obsidian documentada em `tailwind.config.ts` e `globals.css` não é aplicada.
2. **Logos quebrados em todas as páginas:** Imagens `/logos/Logo-2.png` não existem em `apps/web/public/`.
3. **Componentes/Botões inertes (violam Seção 1 e Seção 38 do PDF):**
   - `feed/page.tsx`: botões Mídia, Menu (`MoreVertical`), Curtir (`Heart`), Comentários (`MessageSquare`) e Denunciar (`AlertCircle`).
   - `cursos/page.tsx`: botão `DETALHES`.
   - `mansoes/page.tsx`: botão `SOLICITAR CHAVE`.
   - `(dashboard)/layout.tsx`: input `BUSCAR NA COLMEIA...` e sino de notificações (estático).
   - `page.tsx`: links sociais `Instagram`, `Discord`, `Twitter` no rodapé.
4. **Dados falsos no Dashboard (`dashboard/page.tsx`):** Estatísticas, atividades recentes, progresso de patente e aviso da realeza são todos inventados em código estático.
5. **Ausência de feedback de ações e estados de erro:**
   - `cursos/page.tsx`, `feed/page.tsx`, `membros/page.tsx` e `cadastro/page.tsx` apenas logam erros no `console.error` sem exibir mensagem de erro nem botão de tentar novamente ao usuário.
   - Sem confirmações de ações destrutivas, sem toasts de sucesso/erro, sem paginação no diretório e feed.
6. **Inconsistência de layout público:** `Navbar.tsx` foi criado mas não é usado; cada página pública (`page.tsx`, `lore/page.tsx`, `mansoes/page.tsx`) reimplementa um header diferente.
7. **Sem páginas para módulos essenciais:** Eventos, Perfil, Chat, Medalhas, Aulas/Presenças e Admin têm links ou expectativa direta de uso, mas não existem.

---

## 18. Problemas Técnicos

1. **Falta de `apps/web/postcss.config.js`** — Gravidade: **CRÍTICA** — Tailwind não compila.
2. **Build da API gera estrutura incorreta (`apps/api/dist/apps/api/src/index.js`)** — Gravidade: **ALTA** — `apps/api/tsconfig.json` herda `baseUrl` e `paths` da raiz sem definir `rootDir: "src"`, fazendo `npm start` (`node dist/index.js`) falhar com `MODULE_NOT_FOUND`.
3. **`npm run dev` sequencial na raiz** — Gravidade: **ALTA** — Impede subir frontend e backend juntos.
4. **Ausência de `migrations/` no Prisma e `.env` com placeholders** — Gravidade: **CRÍTICA** — Não há histórico de migrações nem banco ativo.
5. **Seed não idempotente (`apps/api/prisma/seed.ts`)** — Gravidade: **MÉDIA** — Duplica registros em `ClassSchedule` a cada execução.
6. **Divergência entre Route Group `(dashboard)` e links da UI** — Gravidade: **CRÍTICA** — Todas as sub-rotas do painel dão 404.
7. **Dessincronização do `AuthContext`** — Gravidade: **ALTA** — Login e Cadastro não atualizam `user` no contexto; proteção de rota só cobre `/dashboard*` e deixa `/cursos`, `/feed`, `/membros` expostos.
8. **Falta de validação Zod em múltiplos endpoints** — Gravidade: **MÉDIA** — `profile.updateMe`, `academic.enroll`, `academic.createSession`, `academic.validateProof`, `event.update`, `event.rsvp`, `medal.*`, `feed.report` aceitam `req.body` sem schema.
9. **Vazamento de erros internos nas respostas HTTP** — Gravidade: **MÉDIA** — Controllers retornam `error.message` diretamente (expondo erros do Prisma/Zod ao cliente).
10. **Falta de paginação em `getMembers` e logging excessivo no Prisma** — Gravidade: **MÉDIA** — `prisma.ts` tem `log: ['query']` ligado sempre; `getMembers` retorna toda a tabela `Profile`.
11. **Inexistência de controle de versão Git** — Gravidade: **ALTA** — Não há `.git`, dificultando rollback e auditoria de histórico.
12. **`next lint` não configurado** — Gravidade: **BAIXA** — Ausência de `.eslintrc.json` em `apps/web`.

---

## 19. Riscos de Segurança

1. **Ausência de RBAC em endpoints acadêmicos críticos (`apps/api/src/routes/academic.routes.ts` L15-17) — Gravidade: CRÍTICA**
   - `POST /api/academic/courses/:courseId/sessions` e `POST /api/academic/proofs/:proofId/validate` têm apenas `authMiddleware`.
   - **Consequência:** Qualquer usuário `CONVIDADO` pode criar aulas e autoaprovar seus próprios comprovantes de presença.
2. **Vazamento de comprovantes privados (`apps/api/src/routes/academic.routes.ts` L16 / `academic.service.ts` L53-65) — Gravidade: ALTA**
   - `GET /api/academic/courses/:courseId/sessions` retorna todos os `proofs` (com `imageUrl`, `observation` e `profile` de todos os alunos) para qualquer usuário autenticado, violando a Seção 27 do PDF.
3. **IDOR no Chat (`apps/api/src/controllers/chat.controller.ts` e `chat.service.ts`) — Gravidade: ALTA**
   - `getMessages` e `sendMessage` não validam se o usuário pertence à conversa (`ConversationMember`). (Atualmente o router de chat ainda não está montado em `app.ts`, mas o código já contém a brecha).
4. **Fallback inseguro de `JWT_SECRET` (`apps/api/src/config/env.ts` L10) — Gravidade: CRÍTICA**
   - `JWT_SECRET: process.env.JWT_SECRET || 'default-secret'`. Se faltar a variável em produção, qualquer atacante pode forjar tokens válidos.
5. **Ausência de bloqueio para usuários suspensos/banidos — Gravidade: ALTA**
   - Não há campo de suspensão em `User` nem verificação em `login` e `authMiddleware`.
6. **Ausência de Rate Limiting e proteção contra Brute Force — Gravidade: ALTA**
   - Endpoints `/api/auth/login`, `/api/auth/register`, `/api/feed` e `/api/feed/report` não possuem limitação de requisições nem proteção anti-spam.
7. **Ausência de Auditoria (`AuditService` morto) — Gravidade: MÉDIA**
   - Nenhuma ação sensível (cadastro, login, alteração futura de cargos, moderação, validação de comprovantes) gera `AuditLog`.
8. **Rotas `/cursos`, `/feed` e `/membros` sem guarda no frontend (`AuthContext.tsx` L44) — Gravidade: MÉDIA**
   - `pathname.startsWith('/dashboard')` não protege `/feed` nem `/membros` contra renderização não autenticada.
9. **Cookies em deploy separado (Vercel ↔ Render) (`auth.controller.ts` L16) — Gravidade: ALTA**
   - `sameSite: 'lax'` impede o envio do cookie de sessão entre domínios distintos (`*.vercel.app` → `*.onrender.com`) em produção.
10. **Busca imprecisa de perfil por passaporte (`profile.controller.ts` L37) — Gravidade: BAIXA/MÉDIA**
    - `GET /api/profiles/:passport` usa `contains: passport`, podendo retornar o perfil errado se um passaporte for substring de outro.

---

## 20. Arquivos Envolvidos nos Problemas

| Arquivo | Problemas Principais |
|---|---|
| `apps/web/postcss.config.js` *(ausente)* | Tailwind CSS não é compilado (causa raiz visual e de tela vazia). |
| `apps/web/public/` *(vazia)* | Imagens `/logos/Logo-2.png` e `/honeycomb-pattern.svg` retornam 404. |
| `apps/web/src/styles/globals.css` | `@tailwind` e `@apply` crus no CSS final; `.btn-primary` e `.card-premium` mesclados incorretamente sem PostCSS. |
| `apps/web/src/app/(dashboard)/layout.tsx` | Links da sidebar apontam para `/dashboard/*` (404), risco de crash em `user?.profile.name[0]`, sino/busca estáticos, spinner invisível sem Tailwind. |
| `apps/web/src/app/(dashboard)/dashboard/page.tsx` | 100% dados mockados; links 404 (`/dashboard/cursos`, `/atividades`, `/medalhas`). |
| `apps/web/src/contexts/AuthContext.tsx` | Só protege `/dashboard*`, roda `checkUser()` apenas uma vez na montagem, sem tratamento de erro global. |
| `apps/web/src/app/login/page.tsx` e `cadastro/page.tsx` | Não usam `AuthContext.login()`, deixando usuário nulo após login/cadastro. |
| `apps/web/src/app/page.tsx` | Links quebrados (`/historia`, `/mansões`), sem cursos/eventos, `Navbar.tsx` ignorado. |
| `apps/web/src/app/(dashboard)/feed/page.tsx` | Botões de like, comentário, mídia, menu e denúncia inertes; rota real `/feed` não bate com sidebar. |
| `apps/web/src/app/(dashboard)/cursos/page.tsx` | Botão `DETALHES` inerte; sem matrícula/calendário/aulas; rota `/cursos` não bate com sidebar. |
| `apps/web/src/app/(dashboard)/membros/page.tsx` | Sem filtros avançados, sem paginação, link de perfil inerte; rota `/membros` não bate com sidebar. |
| `apps/web/src/app/mansoes/page.tsx` | Conteúdo estático sem imagens/vídeos/galeria/lightbox; botão inerte. |
| `apps/web/src/lib/api.ts` | Sem `timeout` e sem interceptors para tratar `401` ou API offline. |
| `package.json` (raiz) | `npm run dev --workspaces` trava em `apps/api` e nunca sobe `apps/web`. |
| `.env` / `.env.example` | `.env` contém apenas placeholders; falta `NEXT_PUBLIC_API_URL` no `.env.example`. |
| `apps/api/tsconfig.json` | Falta `rootDir: "src"`, quebrando `dist/index.js` no build. |
| `apps/api/src/config/env.ts` | Fallback `'default-secret'` para `JWT_SECRET`; não valida `DIRECT_URL` nem `STORAGE_*`. |
| `apps/api/src/lib/prisma.ts` | `log: ['query']` ligado permanentemente. |
| `apps/api/prisma/schema.prisma` e `migrations/` *(ausente)* | Zero migrations; faltam tabelas RBAC, `CourseCompletion`, `NotificationPreference` e campo de suspensão. |
| `apps/api/prisma/seed.ts` | `classSchedule.create` não idempotente (duplica horários). |
| `apps/api/src/routes/academic.routes.ts` | Falta `roleMiddleware` na criação de aulas e validação de comprovantes. |
| `apps/api/src/services/academic.service.ts` | `getSessions` vaza comprovantes privados; `addMaterial` sem rota. |
| `apps/api/src/services/auth.service.ts` | Não valida existência de `mainCourseId`; não cria `CourseEnrollment(MAIN)`. |
| `apps/api/src/controllers/chat.controller.ts` & `chat.service.ts` | Sem router em `app.ts`; falta checagem de membro (IDOR). |
| `apps/api/src/routes/event.routes.ts` | Impede acesso a eventos públicos sem login. |
| `apps/api/src/controllers/profile.controller.ts` & `services/profile.service.ts` | `getProfileByPassport` usa `contains`; `getMembers` sem paginação; `updateMe` sem Zod. |
| `docs/PROJECT_STATUS.md` | Documenta como concluídos itens quebrados, mockados ou inexistentes. |

---

## 21. Prioridades Organizadas por Criticidade

### P0 — Bloqueadores Imediatos (Impedem o projeto de rodar ou abrem falhas graves)
1. **Corrigir `postcss.config.js` e assets públicos (`apps/web/public/logos`)** para eliminar o problema de CSS não compilado e tela branca/quebrada.
2. **Corrigir rotas do `(dashboard)` / Sidebar / Home** (decidir entre mover páginas para `/dashboard/*` ou atualizar todos os links para `/cursos`, `/feed`, `/membros`, `/lore`, `/mansoes`).
3. **Configurar banco PostgreSQL/Neon real no `.env` e gerar a migration inicial do Prisma** + corrigir idempotência do `seed.ts`.
4. **Corrigir `npm run dev` na raiz** (rodar API + Web em paralelo) e **corrigir `apps/api/tsconfig.json`** (`rootDir` / build `dist/index.js`).
5. **Corrigir segurança crítica no backend:** adicionar RBAC/autoria em `academic.routes.ts` (criar sessão e validar comprovante), proteger privacidade de `proofs` em `getSessions`, remover fallback `'default-secret'` de `JWT_SECRET`, e proteger rotas privadas no `AuthContext`.

### P1 — Correções de Fundação (Autenticação, Consistência e Remoção de Mocks)
6. **Corrigir fluxo do `AuthContext`** (`LoginPage` e `RegisterPage` usando o contexto, proteção de todas as rotas privadas, loading fallback seguro, `error.tsx`, `timeout` no `axios`).
7. **Corrigir cadastro (`AuthService.register`)** para validar `mainCourseId` e criar `CourseEnrollment(MAIN)` + adicionar suporte a usuário suspenso/banido.
8. **Remover 100% dos dados mockados do `/dashboard`** e conectá-lo a dados reais (perfil, matrículas, avisos, eventos, medalhas, notificações).
9. **Completar validação Zod, sanitização de erros e `AuditService.log`** nas rotas existentes.
10. **Inicializar Git** e atualizar `docs/PROJECT_STATUS.md` com o estado real.

### P2 — Módulos Funcionais Principais (Conforme Roadmap do PDF)
11. **Perfil do membro (`/perfil` e `/membros/[passport]`) + paginação e filtros no Diretório + RBAC dinâmico**.
12. **Feed completo** (likes, comentários, respostas, edição/exclusão, denúncias e moderação).
13. **Eventos + Calendário Institucional + eventos públicos**.
14. **Sistema Acadêmico expandido + StorageService (S3)** (página do curso, matrícula secundária, materiais, aulas, comprovantes com upload/Ctrl+V/drag-and-drop, validação/recusa com motivo).
15. **Conclusão de cursos + Medalhas + Conquistas**.

### P3 — Comunicação, Módulos Institucionais e Administração
16. **Chat privado em tempo real com Socket.IO** (corrigindo IDOR antes de expor rotas).
17. **Avisos institucionais + Central de notificações real**.
18. **Projetos, Galeria real das mansões (lightbox/vídeo), Rádio interna, Livro de visitas, Enxamista do mês**.
19. **Painel administrativo completo e moderação**.
20. **Rate limiting, Helmet, CORS/cookies para produção (Vercel/Render/Neon), suíte de testes e documentação final**.

---

## 22. Plano de Recuperação Dividido em Fases

1. **Fase 0 — Preservação e Versionamento:** Inicializar Git para garantir histórico seguro antes de qualquer edição; configurar PostgreSQL/Neon e validar conexão sem perda de dados.
2. **Fase 1 — Desbloqueio do Ambiente Local e Tela Branca:** Criar `apps/web/postcss.config.js`, mover/copiar logos para `apps/web/public/logos/`, corrigir `apps/api/tsconfig.json`, ajustar `npm run dev` paralelo na raiz e alinhar `.env.example` / validação de `env.ts`.
3. **Fase 2 — Correção de Rotas, Auth e Segurança Base:** Alinhar URLs de `(dashboard)` e links da Home, corrigir `AuthContext` + `LoginPage` + `RegisterPage`, aplicar `roleMiddleware` e privacidade no módulo acadêmico, criar migration inicial e tornar `seed.ts` idempotente.
4. **Fase 3 — Fundação Real (Dashboard, Perfis, Diretório e RBAC):** Substituir mocks do Dashboard por APIs reais, criar telas de Perfil e Edição, implementar RBAC extensível no banco e ativar `AuditService`.
5. **Fase 4 — Storage S3 + Acadêmico Completo + Medalhas:** Implementar `StorageService`, upload de comprovantes (Ctrl+V / drag-drop), página do curso, matrículas, aulas, validação com motivo e fluxo de conclusão/medalha.
6. **Fase 5 — Feed Completo, Eventos e Calendários:** Conectar likes/comentários/edição/denúncias no Feed, construir UI e regras de Eventos (público/privado) e Calendário Institucional/Acadêmico.
7. **Fase 6 — Tempo Real (Chat Socket.IO, Avisos e Notificações):** Corrigir IDOR no chat, subir Socket.IO autenticado, conectar avisos e sino de notificações real.
8. **Fase 7 — Módulos Institucionais e Painel Admin:** Galeria das Mansões (sem 3D), Rádio, Projetos, Livro de Visitas, Enxamista do Mês, Conquistas e Painel Admin com moderação e logs.
9. **Fase 8 — Endurecimento, Testes e Deploy:** Rate limiting, testes automatizados (unitários/integração/E2E), ajustes de cookies cross-origin (Vercel ↔ Render ↔ Neon) e validação real de build e deploy.

---

## 23. Próxima Ação Recomendada

Após sua aprovação para sair do modo de auditoria, a **próxima ação exata e segura** é executar a **Fase 1 (Desbloqueio Visual e de Execução Local)**:
1. Criar `apps/web/postcss.config.js` e verificar `next build` gerando todas as classes Tailwind.
2. Disponibilizar os arquivos de `logos/` em `apps/web/public/logos/`.
3. Corrigir o mapeamento de rotas entre `(dashboard)` e os links de navegação (Home e Sidebar), além da sincronização do `AuthContext` e proteção das rotas privadas.
4. Verificar o `.env` com uma instância PostgreSQL/Neon válida, gerar a migration inicial do Prisma e tornar o `seed.ts` idempotente.
5. Corrigir imediatamente as falhas críticas de autorização em `apps/api/src/routes/academic.routes.ts` e `apps/api/src/config/env.ts` (`JWT_SECRET`).

*Aguardando sua autorização para iniciar a execução da Fase 1.*
