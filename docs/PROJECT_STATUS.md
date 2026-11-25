# PROJECT STATUS — ENXAMISTAS

**Última atualização:** 24/11/2026  
**Documento de Referência:** `Enxamistas_Documento_Mestre_Requisitos_Completo.pdf`  
**Auditoria Base:** `docs/AUDITORIA_COMPLETA.md`

---

## 📊 Etapa Atual
- **Fase atual:** **Banco Neon conectado, migration aplicada, seed executado, conta Staff criada e servidores rodando em localhost.**
- **Bloqueios / Dependências Externas:**
  1. **Neon CLI (`neon deploy`):** A CLI está instalada e o projeto `noisy-waterfall-86664123` (`branch: production`) está linkado em `.neon` / `neon.ts`, porém `neon deploy` exige autenticação prévia via `neon login` em terminal interativo. O banco Neon foi conectado diretamente pela string fornecida e validado ponta a ponta.
  2. **Storage S3 (`STORAGE_*`):** As credenciais de bucket compatível com S3 estão vazias no `.env`. O `StorageService` valida arquivos/assinaturas e reporta explicitamente `503 STORAGE_NOT_CONFIGURED` quando não configurado.
  3. **Deploy Online (Vercel + Render):** Falta inicializar repositório Git, publicar o backend (`apps/api`) no Render Free e o frontend (`apps/web`) no Vercel Hobby (detalhes no `README.md`).

---

## ✅ Problemas da Auditoria Corrigidos
- [x] Tailwind CSS não compilava (`apps/web/postcss.config.js` criado; build gera CSS completo sem `@tailwind` cru).
- [x] `apps/web/public/` vazio (logos copiados para `public/logos/` e `honeycomb-pattern.svg` criado).
- [x] `npm run dev` bloqueando em `apps/api` (corrigido com `scripts/dev.js` paralelo).
- [x] Build de produção da API gerando `dist/apps/api/src/index.js` (corrigido com `rootDir: "./src"` em `apps/api/tsconfig.json`).
- [x] Rotas 404 na Home (`/historia`, `/mansões`) e na Sidebar/Dashboard (`/dashboard/*`) corrigidas e alinhadas.
- [x] `AuthContext` sincronizado com `login/page.tsx` e `cadastro/page.tsx`; proteção aplicada a todas as rotas autenticadas; `error.tsx` adicionado.
- [x] Mocks removidos de `dashboard/page.tsx` e conectados a dados reais.
- [x] Brechas críticas de segurança fechadas: RBAC em `academic.routes.ts`, privacidade de comprovantes em `getSessions`, checagem de participante/IDOR no `ChatService` e Socket.IO, bloqueio de usuários suspensos no login e `authMiddleware`, remoção de fallback inseguro de `JWT_SECRET` em produção, busca exata em `GET /api/profiles/:passport`, `seed.ts` idempotente.
- [x] Botões inertes eliminados em Feed (curtidas, comentários, respostas, mídia, editar/excluir, denúncias), Cursos (`DETALHES`, matrículas, aulas, materiais, comprovantes, conclusões), Mansões (`SOLICITAR CHAVE`, galeria por ambientes, vídeo/tour, lightbox), Membros (filtros, paginação, perfil individual `/membros/[passport]`) e Home (links sociais configuráveis via `Setting`).

---

## 🧪 Testes Executados e Resultados
- **`npm run build --workspace=@enxamistas/shared`** → **Aprovado (código 0)**.
- **`npm run build --workspace=@enxamistas/api`** → **Aprovado (código 0)** (`dist/index.js` e `dist/app.js` gerados).
- **`npm run build --workspace=@enxamistas/web`** → **Aprovado (código 0)** (27 rotas compiladas, zero erros TypeScript/Next).
- **`npx prisma validate` e `npx prisma generate`** → **Aprovado (código 0)** (Prisma Client v5.22.0 gerado com todos os novos modelos).
- **`npm test` (`apps/api/tests/enxamistas.test.js` com `node --test`)** → **8/8 testes aprovados (`pass 8, fail 0, skipped 0`)**.
- **`npx prisma migrate dev --name init` + `npm run prisma:seed`** → **Aplicados no Neon (`neondb`) com sucesso** (`20261125030256_init`, 18 cursos, 20 horários, 8 cargos/13 permissões, 2 mansões, 4 conquistas, settings).
- **Conta Staff (`STAFF_ZANGAO`)** → Criada no Neon via `apps/api/prisma/create-staff.ts` (`passport: "1"`).
- **Verificação ponta a ponta (`localhost` + Neon)** → **Aprovada (`E2E_VERIFICATION_PASSED`)**: `/health` (`database: "connected"`), `/api/courses` (18), `/api/gallery/mansions` (2), `/api/institutional/public` (`200`), login Staff + `/api/auth/me` + `/api/admin/metrics` + `/api/profiles/me`, `/api/feed`, `/api/events`, `/api/announcements`, `/api/notifications`, `/api/radio` (`200`) e 9 rotas do Next.js (`200`).

---

## 📋 Checklist Completo dos 39 Tópicos do Documento Mestre

| Tópico (PDF) | Status Atual | Observação / Evidência |
|---|---|---|
| 1. Visão geral e objetivo | **Implementado, não testado em DB** | Arquitetura modular completa sem mocks nem botões inertes. |
| 2. Stack tecnológica e hospedagem | **Implementado, não testado em DB** | Next.js 14, Express, Socket.IO, Prisma/Neon, `StorageService` S3. |
| 3. Organização de código / monorepo | **Concluído e testado (build)** | `apps/web`, `apps/api`, `packages/shared`, `docs/`, `scripts/dev.js`. |
| 4. Identidade visual e experiência | **Concluído e testado (build)** | Tema dark/gold/graphite compilado via PostCSS/Tailwind + `RoleBadge`, `Modal`, `Toast`. |
| 5. Portal público e institucional | **Implementado, não testado em DB** | Home (`/`), Lore (`/lore`), Catálogo público (`/catalogo`), Mansões (`/mansoes`), Projetos (`/projetos`), Livro (`/livro-de-visitas`). |
| 6. Cadastro, login e autenticação | **Implementado e testado (unitário)** | Argon2, JWT HttpOnly, rate limit, checagem de suspensão, `mainCourseId` validado. |
| 7. Hierarquia de cargos e RBAC | **Implementado e testado (unitário)** | 8 cargos + tabelas `Role`, `Permission`, `RolePermission`, `UserRoleAssignment` + bloqueio de autoalteração + `AuditService`. |
| 8. Perfil do membro | **Implementado, não testado em DB** | `/perfil` (edição autorizada + avatar) e `/membros/[passport]`. |
| 9. Diretório privado de membros | **Implementado, não testado em DB** | `/membros` com busca debounced, filtros (cargo, curso, medalha, conclusão) e paginação. |
| 10. Dashboard após login | **Implementado, não testado em DB** | `/dashboard` conectado a matrículas, medalhas, eventos, membros, avisos e Enxamista do mês reais. |
| 11. Sistema acadêmico (cursos/professores/horários) | **Implementado, não testado em DB** | `/cursos` (grade + calendário semanal) e `/cursos/[id]` + seed idempotente 18 cursos/20 horários. |
| 12. Eventos e calendário institucional | **Implementado e testado (unitário RSVP)** | `/eventos` (CRUD + RSVP atômico + notificações) e `/calendario` (visões mensal, semanal e lista). |
| 13. Feed privado / comunidade | **Implementado, não testado em DB** | `/feed` com posts, mídia, edição/exclusão, curtidas, comentários, respostas e denúncias. |
| 14. Aulas, presença e comprovantes | **Implementado e testado (unitário)** | `FileUploadZone` (upload, Ctrl+V, drag-drop, preview, substituir/remover) + validação/recusa com motivo. |
| 15. Conclusão de cursos e medalhas | **Implementado e testado (unitário)** | `CourseCompletion` + validação de presenças + medalha única em `/cursos/[id]` e `/medalhas`. |
| 16. Chat privado em tempo real | **Implementado e testado (unitário IDOR)** | `/chat` + Socket.IO autenticado + persistência PostgreSQL + anti-spam + unread count. |
| 17. Rádio interna | **Implementado, não testado em DB** | `RadioContext` + `RadioBar` persistente + `/radio` (sem autoplay inesperado, tratamento de falha). |
| 18. Galeria das mansões | **Implementado, não testado em DB** | `/mansoes` + `/mansoes/[slug]` (vídeo/tour, categorias de ambientes, Lightbox, `MansionKeyRequest`). |
| 19. Conquistas (achievements) | **Implementado, não testado em DB** | Conquistas automáticas e manuais exibidas em `/medalhas` e perfis. |
| 20. Avisos institucionais | **Implementado, não testado em DB** | `/avisos` + API CRUD/pin/expiração + exibição no Dashboard. |
| 21. Central de notificações | **Implementado, não testado em DB** | `/notificacoes` + contador no Header + preferências (`NotificationPreference`). |
| 22. Projetos dos membros | **Implementado, não testado em DB** | `/projetos` e `/projetos/[id]` com busca, filtro e criação/exclusão autorizada. |
| 23. Livro de visitas | **Implementado e testado (unitário Zod)** | `/livro-de-visitas` com limite de 400 caracteres, visibilidade configurável e moderação. |
| 24. Enxamista do mês | **Implementado, não testado em DB** | `/reconhecimento` + destaque no Dashboard + prevenção de duplicação membro/mês. |
| 25. Painel administrativo | **Implementado e testado (unitário RBAC)** | `/admin` (métricas, membros, suspensão, cargos, RBAC extensível, denúncias, comprovantes/chaves, settings, logs). |
| 26. Denúncias e moderação | **Implementado, não testado em DB** | Fluxo `PENDING → ANALYZING → RESOLVED → REJECTED` no backend e `/admin`. |
| 27. Privacidade e controle de acesso | **Implementado e testado (unitário)** | Rotas protegidas, comprovantes privados, chat restrito a membros, suspensos bloqueados. |
| 28. Banco de dados — modelos previstos | **Implementado (schema validado)** | Todos os modelos no `schema.prisma`; aguardando `.env` real para `migrate dev`. |
| 29. API e arquitetura backend | **Implementado e compilado** | `/api` e `/api/v1`, Zod, `AppError`, `errorMiddleware`, controllers/services/routes modulares. |
| 30. Storage / uploads | **Implementado e testado (unitário)** | `StorageService` SigV4 S3 + `/api/uploads/:scope` + `/api/uploads/private/*`. |
| 31. Segurança obrigatória | **Implementado e testado (unitário)** | Argon2, HttpOnly cookies, CORS restrito, headers de segurança, rate limit, RBAC, auditoria. |
| 32. Performance e UX | **Implementado (build OK)** | Paginação em feed/membros/audit, debounce em buscas, skeletons, estados empty/error/success, `RadioBar`. |
| 33. Testes | **Parcial (8 unitários aprovados)** | `apps/api/tests/enxamistas.test.js` passando 8/8; faltam testes E2E com banco real. |
| 34. Documentação e deploy | **Parcial** | `README.md`, `.env.example`, guias Vercel/Render/Neon documentados; deploy não executado. |
| 35–39. Roadmap, Continuidade e Auditoria | **Concluído em código** | Todas as fases implementadas em código preservando o projeto existente. |

---

## 🎯 Próxima Tarefa Exata (Ação do Usuário / Configuração Externa)
1. Preencher no `.env` os valores reais de `DATABASE_URL`, `DIRECT_URL` (PostgreSQL local ou Neon) e `JWT_SECRET` (e opcionalmente `STORAGE_*` para uploads S3).
2. Executar no diretório `apps/api`:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
3. Iniciar o sistema na raiz com `npm run dev` e validar o fluxo real completo no navegador (`http://localhost:3000`).
