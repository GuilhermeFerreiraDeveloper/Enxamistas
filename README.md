# ENXAMISTAS — Portal Oficial

Plataforma institucional, comunitária e acadêmica da organização **Enxamistas** (GTA RP / FiveM).

---

## 🚀 Arquitetura do Monorepo

- `apps/web`: Frontend **Next.js 14** (App Router, React, TypeScript, Tailwind CSS, Lucide Icons, Socket.IO Client).
- `apps/api`: Backend **Express + Socket.IO** (Node.js, TypeScript, Prisma ORM, Argon2, JWT em cookies `HttpOnly`, `StorageService` compatível com S3).
- `packages/shared`: Enums, hierarquia de cargos (`UserRole`, `RoleHierarchy`, `RoleLabels`) e contratos de validação **Zod** compartilhados.
- `docs/`: Documentação técnica, auditoria e controle de progresso (`AUDITORIA_COMPLETA.md`, `PROJECT_STATUS.md`).

---

## 📋 Pré-requisitos

- Node.js 18+ (testado com Node 24)
- npm 9+
- PostgreSQL local ou **Neon Free** (`DATABASE_URL` e `DIRECT_URL`)
- Storage compatível com **S3** (opcional em desenvolvimento; obrigatório para upload permanente de arquivos em produção)

---

## ⚙️ Instalação e Configuração Local

1. Copie `.env.example` para `.env` na raiz e preencha as variáveis reais:
   ```bash
   cp .env.example .env
   ```
2. Preencha no `.env`:
   - `DATABASE_URL` e `DIRECT_URL` (PostgreSQL / Neon)
   - `JWT_SECRET` (segredo forte e aleatório; obrigatório em produção)
   - `FRONTEND_URL="http://localhost:3000"`
   - `API_URL="http://localhost:3001"`
   - `NEXT_PUBLIC_API_URL="http://localhost:3001/api"`
   - `PORT=3001`
   - `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` (opcional localmente; obrigatório para upload permanente de avatares, comprovantes e mídia)
3. Instale as dependências na raiz:
   ```bash
   npm install
   ```

---

## 🗄️ Banco de Dados, Migrations e Seed

No diretório `apps/api` (ou usando `--workspace=@enxamistas/api`):

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

O seed idempotente cadastra:
- Os 8 cargos iniciais (`STAFF_ZANGAO` até `CONVIDADO`) e permissões base de RBAC.
- As **18 disciplinas e 20 ocorrências semanais** obrigatórias + medalhas padrão de conclusão.
- As 2 Mansões iniciais (`Mansão Real` e `Refúgio da Montanha`).
- Conquistas automáticas iniciais e configurações institucionais padrão.

---

## 🏃 Execução e Testes

- **Desenvolvimento (API + Web em paralelo):**
  ```bash
  npm run dev
  ```
  Frontend: `http://localhost:3000` | API + Socket.IO: `http://localhost:3001` (`GET /health`).
- **Build completo do monorepo:**
  ```bash
  npm run build
  ```
- **Testes automatizados críticos:**
  ```bash
  npm test
  ```

---

## ☁️ Guia de Deploy (Tiers Gratuitos: Vercel + Render + Neon)

1. **Banco (Neon Free):**
   - Crie o projeto no Neon e configure `DATABASE_URL` (connection pooling) e `DIRECT_URL` (conexão direta para `prisma migrate deploy`).
2. **Backend (Render Free Web Service):**
   - Root/Build Command: `npm install && npm run build --workspace=@enxamistas/shared && npm run build --workspace=@enxamistas/api`
   - Start Command: `npm run start --workspace=@enxamistas/api`
   - Env vars: `NODE_ENV=production`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_URL` (URL exata do Vercel, sem barra final), `STORAGE_*`.
   - Em produção (`NODE_ENV=production`), cookies usam `httpOnly: true`, `secure: true`, `sameSite: 'none'` (HTTPS obrigatório para autenticação cross-domain Vercel ↔ Render).
   - **Arquivos da rádio:** MP3s não são enviados ao GitHub (estão excluídos no `.gitignore`). Para a biblioteca sobreviver a deploys, configure um disco persistente no Render, use `RADIO_MUSIC_DIR` apontando para o mount (por exemplo `/var/data/musicas`) e mantenha as pastas por passaporte dentro dele. Sem disco persistente, o filesystem do serviço é efêmero e as músicas desaparecem em novos deploys.
   - **Outros uploads:** Não salve uploads no disco efêmero do Render; use um bucket S3 compatível (Cloudflare R2, AWS S3, Backblaze B2, Supabase Storage).
3. **Frontend (Vercel Hobby):**
   - Root Directory: `apps/web` (ou monorepo com install na raiz)
   - Env var: `NEXT_PUBLIC_API_URL="https://sua-api.onrender.com/api"`

---

## 🛠️ Troubleshooting

- **CSS / Tailwind não aplica:** Verifique se `apps/web/postcss.config.js` está presente e limpe `apps/web/.next` antes de rebuildar.
- **Upload retorna erro 503 (`STORAGE_NOT_CONFIGURED`):** Preencha `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY` e `STORAGE_SECRET_KEY` no `.env`.
- **Login em produção não persiste cookie:** Verifique `HTTPS`, `FRONTEND_URL` exata na API (CORS) e `NODE_ENV=production`.
