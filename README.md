# Enxamistas — Portal Oficial

Portal institucional da fraternidade **Enxamistas** (GTA RP / FiveM), com áreas pública e autenticada para comunidade, academia, eventos, comunicação e administração.

Este README é o guia central para instalar, executar, configurar, testar e publicar o projeto. Segredos, senhas, tokens e URLs de conexão privados **nunca** devem ser adicionados ao Git.

## Índice

- [Visão geral](#visão-geral)
- [Tecnologias e arquitetura](#tecnologias-e-arquitetura)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Funcionalidades e navegação](#funcionalidades-e-navegação)
- [Pré-requisitos](#pré-requisitos)
- [Instalação local](#instalação-local)
- [Configuração de ambiente](#configuração-de-ambiente)
- [Banco de dados e migrations](#banco-de-dados-e-migrations)
- [Executar, compilar e testar](#executar-compilar-e-testar)
- [API e autenticação](#api-e-autenticação)
- [Deploy: Neon, Render e Vercel](#deploy-neon-render-e-vercel)
- [Armazenamento da rádio e arquivos](#armazenamento-da-rádio-e-arquivos)
- [Operação e segurança](#operação-e-segurança)
- [Solução de problemas](#solução-de-problemas)

## Visão geral

O projeto é um monorepo npm com três workspaces:

| Workspace | Responsabilidade |
| --- | --- |
| `apps/web` | Portal web, páginas públicas e Colmeia autenticada |
| `apps/api` | API HTTP, autenticação, regras de negócio, Prisma e Socket.IO |
| `packages/shared` | Tipos, enums, hierarquia de cargos e schemas Zod compartilhados |

O Postgres é a fonte de dados principal. O Neon é o provedor utilizado no fluxo de hospedagem documentado. Os arquivos MP3 da rádio ficam no filesystem persistente da API; os outros arquivos enviados usam storage compatível com S3 quando este está configurado.

## Tecnologias e arquitetura

- **Web:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Axios e Lucide.
- **API:** Node.js, Express, TypeScript, Socket.IO, JWT, Argon2 e Zod.
- **Dados:** PostgreSQL, Prisma ORM e Prisma Migrate.
- **Validação compartilhada:** Zod, em `packages/shared`.
- **Hospedagem prevista:** Vercel (web), Render (API e disco persistente) e Neon (Postgres).

Em desenvolvimento, `npm run dev` inicia web e API em paralelo. Em produção, o Next.js encaminha as chamadas REST do navegador no caminho `/api` para o host indicado em `NEXT_PUBLIC_API_URL`; isso mantém os cookies de sessão na origem do site. A API ainda usa CORS com credenciais para origens permitidas. O Socket.IO e alguns streams/uploads binários podem conectar-se diretamente à API.

## Estrutura do repositório

```text
apps/
  api/
    prisma/                 Schema, migrations e seed do banco
    src/
      controllers/          Adaptadores HTTP
      middlewares/          Autenticação, permissões e rate limit
      routes/               Rotas REST
      services/             Regras de negócio
      socket/               Socket.IO
    tests/                  Testes automatizados Node.js
  web/
    src/app/                Páginas e layouts Next.js
    src/components/         Componentes reutilizáveis, Navbar e player
    src/contexts/           Contextos de autenticação, rádio e notificações
    src/lib/                API, mídia e utilitários
packages/
  shared/                   Contratos e tipos compartilhados
musicas/                    Biblioteca MP3 local (não é publicada no Git)
docs/                       Auditorias e documentação técnica complementar
scripts/dev.js              Inicializa API e web em paralelo
.env.example                Modelo das variáveis de ambiente
```

## Funcionalidades e navegação

### Área pública

- `/` — página inicial e apresentação institucional.
- `/lore` — história e regras da fraternidade.
- `/comunidade` e `/comunidade/[profileId]` — diretório e perfis públicos.
- `/catalogo` — catálogo público de cursos.
- `/eventos` e `/calendario` — agenda e eventos conforme visibilidade.
- `/mansoes` e `/mansoes/[slug]` — mansões e páginas de álbum.
- `/projetos` e `/projetos/[id]` — projetos.
- `/galeria` — galeria pública.
- `/cinematica` — acervo de vídeos.
- `/livro-de-visitas` — livro de visitas.
- `/login` e `/cadastro` — acesso e criação de conta.

### Colmeia (área autenticada)

- `/dashboard` — painel do membro.
- `/perfil` — perfil próprio.
- `/cursos` e `/cursos/[id]` — matrículas, cursos, materiais e comprovantes.
- `/eventos`, `/calendario`, `/medalhas` e `/reconhecimento` — participação e conquistas.
- `/feed`, `/avisos`, `/notificacoes` e `/chat` — comunicação da comunidade.
- `/membros` e `/membros/[passport]` — consulta de membros.
- `/radio` — player, pedidos, status e playlist pessoal.
- `/admin` — painel administrativo, sujeito a permissões.

A navegação tem um link **Voltar ao site** para a área pública; usá-lo não encerra a sessão. O layout global mantém os controles do player durante a navegação entre páginas.

### Perfis, cargos e administração

O cadastro cria uma conta associada a um passaporte e um perfil. Cargos são definidos pelo enum `UserRole` e pela hierarquia compartilhada em `packages/shared`. O seed prepara os cargos do sistema, permissões RBAC e associações padrão. As rotas administrativas também validam permissões no backend; ocultar um botão no frontend não substitui autorização no servidor.

A administração inclui edição de dados do membro, cargos conforme permissões, suspensão, curso principal, revisão de conclusão acadêmica e concessão/remoção de medalhas. Aprovações de curso podem conceder medalha de mérito. As alterações administrativas relevantes geram registros de auditoria e, quando aplicável, notificações.

### Rádio

- A biblioteca pública lista arquivos MP3 aprovados/disponíveis e permite ouvir sem autenticar.
- O catálogo público não expõe o passaporte na lista; os streams usam identificadores opacos.
- O player global embaralha as faixas e oferece play/pausa, próxima/anterior, volume, mute e progresso.
- Membros autenticados podem enviar pedidos (título, artista e link de referência), consultar os estados e ver sua playlist.
- Staff autorizada revisa pedidos, recusa com motivo e associa MP3s existentes ou carregados à playlist do membro.
- A biblioteca é formada por arquivos `musicas/` e suas subpastas. Ao adicionar manualmente, a organização recomendada é `musicas/<passaporte>/<arquivo>.mp3`.
- O upload administrativo aceita MP3 de até 50 MB. Arquivos não são guardados no banco nem versionados no Git.

**Autoplay:** o player tenta começar assim que a biblioteca é carregada. Chrome, Safari e outros navegadores podem bloquear áudio com som até uma interação explícita do usuário; se isso ocorrer, use Play na barra. A reprodução automática não pode ser garantida pelo código contra a política do navegador.

## Pré-requisitos

- Node.js 18 ou superior (o projeto foi testado também em Node 24).
- npm 9 ou superior.
- PostgreSQL local ou um banco Neon.
- Acesso ao repositório e às credenciais do ambiente de desenvolvimento.
- Storage S3 compatível apenas se o ambiente precisar persistir os uploads que usam `StorageService`.

## Instalação local

Execute os comandos na raiz do repositório. No PowerShell:

```powershell
Copy-Item .env.example .env
npm install
```

No macOS/Linux:

```bash
cp .env.example .env
npm install
```

Edite o `.env` criado e configure pelo menos `DATABASE_URL`, `DIRECT_URL` e `JWT_SECRET`. Para desenvolvimento local, os padrões de `FRONTEND_URL`, `API_URL`, `NEXT_PUBLIC_API_URL` e `PORT` do arquivo de exemplo usam os endereços localhost. Consulte a tabela abaixo.

Aplique as migrations e carregue os dados iniciais:

```bash
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
npm run prisma:seed --workspace=@enxamistas/api
```

Se estiver desenvolvendo uma alteração de schema local, crie uma migration nomeada em vez de editar o banco manualmente:

```bash
npx prisma migrate dev --schema apps/api/prisma/schema.prisma --name nome_da_mudanca
```

O seed é baseado em upserts e prepara cargos, permissões, cursos e horários oficiais, medalhas padrão dos cursos, mansões iniciais, conquistas e configurações institucionais. Ele não cria uma conta administrativa inicial. Não execute seed, migrations ou SQL destrutivo em produção sem revisar o impacto e possuir backup.

## Configuração de ambiente

Use `.env.example` como referência. Valores de produção devem ser configurados nos painéis dos provedores, nunca commitados.

| Variável | Serviço | Uso |
| --- | --- | --- |
| `DATABASE_URL` | API / Prisma | Conexão normal com Postgres; no Neon, use a URL pooled para o tráfego da aplicação. |
| `DIRECT_URL` | API / Prisma Migrate | Conexão direta sem pooler, usada pelo Prisma para tarefas de schema. |
| `JWT_SECRET` | API | Segredo forte e privado para assinar JWTs. Obrigatório em produção; não reutilize o valor de exemplo. |
| `FRONTEND_URL` | API | Origem(ns) web permitidas pelo CORS, sem barra final. Mais de uma origem pode ser separada por vírgula. |
| `PORT` | API | Porta HTTP; padrão `3001` localmente. A plataforma pode fornecer este valor. |
| `API_URL` | Exemplo local | URL base informativa do serviço da API; o servidor usa `PORT` e a web usa `NEXT_PUBLIC_API_URL`. |
| `NEXT_PUBLIC_API_URL` | Web / build | URL pública da API incluindo `/api`, por exemplo `https://api.exemplo.com/api`. Também define o destino do rewrite `/api/*` no Next.js. |
| `STORAGE_ENDPOINT` | API | Endpoint S3 do Cloudflare R2, no formato `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`. |
| `STORAGE_BUCKET` | API | Nome do bucket R2 que deve armazenar os uploads da aplicação e objetos da rádio no prefixo `musicas/`. |
| `STORAGE_ACCESS_KEY` | API | Access Key ID de uma chave S3 do R2 com acesso ao bucket. |
| `STORAGE_SECRET_KEY` | API | Secret Access Key correspondente à chave S3 do R2. |
| `RADIO_MUSIC_DIR` | API | Diretório legado para biblioteca local em desenvolvimento; quando R2 está configurado, a rádio usa o bucket e ignora essa variável. |
| `NODE_ENV` | API | Defina `production` em produção; habilita configurações de cookie seguro e validação de segredo. |

Em desenvolvimento, `FRONTEND_URL=http://localhost:3000`, `API_URL=http://localhost:3001`, `NEXT_PUBLIC_API_URL=http://localhost:3001/api` e `PORT=3001` são os valores esperados.

## Banco de dados e migrations

O schema está em `apps/api/prisma/schema.prisma`, com PostgreSQL e Prisma. Os modelos cobrem, entre outros: usuários, perfis, cargos/permissões, cursos, matrículas, sessões e comprovantes, medalhas e conquistas, feed e comentários, eventos, conversas e mensagens, mansões/galeria, projetos, notificações, rádio, auditoria e configurações.

Migrations existentes ficam em `apps/api/prisma/migrations/` e devem ser mantidas sob controle de versão. Para aplicar migrations já criadas num ambiente de deploy, use `prisma migrate deploy` com `DIRECT_URL` disponível. Não use `migrate dev` em produção e não altere tabelas diretamente pelo SQL Editor como substituto de uma migration versionada.

Para inspecionar ou operar localmente:

```bash
npx prisma studio --schema apps/api/prisma/schema.prisma
npx prisma migrate status --schema apps/api/prisma/schema.prisma
```

`DATABASE_URL` e `DIRECT_URL` precisam apontar para o mesmo banco/branch. Com Neon, use pooled para consultas comuns e direct para migrations. Nunca coloque nenhuma das URLs no frontend ou em código público.

## Executar, compilar e testar

Na raiz do monorepo:

```bash
npm run dev       # API e web em paralelo
npm run dev:api   # apenas API
npm run dev:web   # apenas web
npm run build     # shared, API e web
npm test          # testes da API
npm run lint      # linters configurados pelos workspaces
```

Endereços locais:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Health check: `http://localhost:3001/health`
- Socket.IO: servidor da API na porta `3001`

A suíte é executada com o test runner nativo do Node (`node --test`) e cobre fluxos críticos de autenticação, autorização, academia, medalhas, rádio, uploads e outras regras. Após mudanças, rode pelo menos `npm run build` e `npm test`.

## API e autenticação

A API registra os endpoints sob `/api`. O mesmo router também é disponibilizado sob `/api/v1` para compatibilidade. Rotas importantes:

| Prefixo | Uso principal |
| --- | --- |
| `/api/auth` | Cadastro, login, logout e usuário atual (`/me`). |
| `/api/profiles` | Perfil próprio, membros e perfis públicos. |
| `/api/courses` | Catálogo, docentes e cursos. |
| `/api/academic` | Matrículas, comprovantes, sessões, materiais e conclusões. |
| `/api/events` | Eventos, RSVP e calendário institucional. |
| `/api/medals` | Catálogo, medalhas e conquistas. |
| `/api/feed` | Feed, comentários, reações, denúncias e galeria. |
| `/api/chat` | Conversas, mensagens e confirmação de leitura. |
| `/api/notifications` | Notificações e preferências. |
| `/api/admin` | Painel administrativo e controles protegidos por permissões. |
| `/api/radio` | Player, pedidos, playlists e biblioteca MP3. |
| `/api/cinematics` | Catálogo/stream de vídeos e gestão autorizada. |
| `/api/institutional/public` | Dados públicos da página institucional. |
| `/health` | Estado do serviço e tentativa de conexão com o banco. |

Acesso público/autenticado varia conforme o endpoint; algumas rotas aceitam autenticação opcional. Consulte os middlewares e `apps/api/src/routes/` antes de integrar um novo cliente.

O login verifica senha com Argon2 e retorna JWT em cookie `HttpOnly` com validade de sete dias. Em produção, o cookie é `Secure` e `SameSite=None`. A web usa `withCredentials` e, para chamadas Axios do navegador, o rewrite do Next.js encaminha `/api/*` ao Render como same-origin. A variável `NEXT_PUBLIC_API_URL` é necessária no build/deploy da web para configurar esse destino. `FRONTEND_URL` na API continua precisando permitir a origem do site para as chamadas diretas que dependem de CORS.

Uma conta pode autenticar em navegadores/dispositivos diferentes: o projeto não mantém um registro de sessões por dispositivo que invalide automaticamente os outros logins. Cada navegador armazena seu próprio cookie. Logout remove o cookie daquele cliente; não é um mecanismo de revogação global de todos os JWTs já emitidos.

## Deploy: Neon, Render e Vercel

### 1. Neon — PostgreSQL

1. Crie ou selecione o projeto e a branch de produção.
2. Configure `DATABASE_URL` com a conexão pooled e `DIRECT_URL` com a conexão direta do mesmo banco.
3. Mantenha ambas privadas e adicione-as às variáveis do serviço da API no Render.
4. Aplique migrations versionadas durante o deploy, conforme a configuração da API. Antes de mudanças de schema, valide a migration numa branch de banco e mantenha um plano de backup/recuperação.

### 2. Render — API

Crie um Web Service usando o repositório Git e o diretório raiz do monorepo.

- **Build command:**

  ```bash
  npm install && npm run build --workspace=@enxamistas/shared && npm run build --workspace=@enxamistas/api
  ```

- **Start command:**

  ```bash
  npm run start --workspace=@enxamistas/api
  ```

- **Variáveis:** `NODE_ENV=production`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_URL` e as quatro variáveis `STORAGE_*` com as credenciais do bucket R2.
- `FRONTEND_URL` deve conter a origem exata do site publicado, como `https://seu-site.vercel.app`, sem barra final. Se forem necessárias outras origens controladas, a API aceita origens separadas por vírgula.
- Configure as regras CORS do bucket R2 conforme a seção [Armazenamento da rádio e arquivos](#armazenamento-da-rádio-e-arquivos).
- Configure o health check para `/health`, quando disponível no plano. O R2 evita precisar de disco persistente do Render para a biblioteca da rádio.

### 3. Vercel — Web

- Para o monorepo, mantenha a instalação na raiz do repositório e configure o projeto para construir `apps/web` com os workspaces necessários disponíveis. A saída do Next.js é detectada automaticamente.
- **Install command:** `npm install`
- **Build command:**

  ```bash
  npm run build --workspace=@enxamistas/shared && npm run build --workspace=@enxamistas/web
  ```

- Configure `NEXT_PUBLIC_API_URL` com o endpoint público da API incluindo `/api`, por exemplo `https://sua-api.onrender.com/api`.
- Variáveis `NEXT_PUBLIC_*` são incorporadas durante o build: depois de alterá-las, faça um novo deploy.
- Após publicar a web, confirme que `FRONTEND_URL` no Render corresponde exatamente ao domínio que os usuários abrem.

### 4. Publicação de alterações

1. Crie e valide a alteração localmente.
2. Rode build e testes relevantes.
3. Envie a branch configurada para GitHub.
4. Aguarde os deploys automáticos de Vercel/Render terminarem.
5. Confira o health check da API, a página publicada, o login e as funções afetadas.
6. Migrations devem estar versionadas e aplicadas ao banco correto antes de depender de uma mudança de schema.

Não compartilhe `.env`, URLs completas de conexão, chaves S3, `JWT_SECRET`, cookies ou tokens em commits, issues ou capturas de tela.

## Armazenamento da rádio e arquivos

Com `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY` e `STORAGE_SECRET_KEY` configurados para o Cloudflare R2, a rádio grava, lista e exclui MP3s no bucket, sob chaves como `musicas/4796/faixa.mp3`. Uploads usam a API; a reprodução redireciona para uma URL R2 assinada temporária, mantendo o bucket privado. `RADIO_MUSIC_DIR` é usado apenas como fallback local quando o R2 não está configurado. Os arquivos não ficam no banco nem no Git.

Para conectar o bucket que você já utiliza: use o endpoint S3 da sua conta (`https://<ACCOUNT_ID>.r2.cloudflarestorage.com`), o nome exato do bucket e as credenciais S3 com permissões de leitura/listagem, escrita e exclusão de objetos. Cadastre esses quatro valores como `STORAGE_*` no serviço da API; não os configure como `NEXT_PUBLIC_*` nem os envie ao Git. O inventário remoto fica em cache na API por até cinco minutos e é atualizado imediatamente após uploads e exclusões.

No bucket R2, configure CORS para permitir `GET` e `HEAD` da origem do site (domínio Vercel de produção e previews necessários), permitir o header `Range` e expor `Accept-Ranges`, `Content-Length`, `Content-Range` e `ETag`. A aplicação usa URLs assinadas, então não torne o bucket público e não coloque credenciais no frontend.

O painel Admin → Músicas organiza os arquivos pelo passaporte (`musicas/<passaporte>/<arquivo>.mp3`), lista a biblioteca inteira, permite filtrar, excluir faixas individuais e limpar toda a biblioteca após confirmação. Excluir uma faixa também a remove das playlists vinculadas, preservando o registro do pedido. O R2 mantém os objetos fora do filesystem efêmero do Render; ainda assim, mantenha backups se os arquivos forem importantes.

Para migrar faixas que estejam somente no disco local atual, baixe-as antes de alterar a configuração do serviço e reenvie-as pelo painel depois que as credenciais R2 estiverem configuradas. A aplicação não move automaticamente os arquivos locais já existentes para o bucket. Se já houver objetos no bucket sob `musicas/<passaporte>/`, a biblioteca será reconhecida automaticamente; objetos antigos em outros prefixos não serão detectados.

Outros arquivos (por exemplo, mídia submetida a fluxos de upload) devem usar um bucket S3 compatível em produção, não o disco efêmero do container. O endpoint aceita implementações S3 compatíveis, como R2 ou serviços equivalentes, desde que os dados de conexão estejam corretos.

## Operação e segurança

- Mantenha segredos somente nos gerenciadores de variáveis do Render/Vercel e no `.env` local ignorado pelo Git.
- Produção exige `JWT_SECRET` próprio e forte; a API falha ao iniciar se o segredo de exemplo for usado em `NODE_ENV=production`.
- Use HTTPS nos domínios públicos. Cookies de produção são `Secure`.
- Permissões RBAC são validadas no backend. Conceda somente os cargos/permissões necessários.
- A API aplica rate limits em algumas operações sensíveis. O armazenamento de rate limit atual é em memória por processo; uma reinicialização ou múltiplas instâncias não compartilham o contador.
- Revise migrations, logs e retenção dos arquivos antes de alterações de produção. Tenha um plano de backup e teste de restauração para o banco e para os objetos do bucket R2.
- O catálogo público de rádio expõe somente faixas disponíveis e usa token opaco para o stream; não inclua passaportes em URLs públicas.

## Solução de problemas

| Sintoma | O que verificar |
| --- | --- |
| `Sessão não pôde ser confirmada após o login` | Aguarde o deploy da web; confirme `NEXT_PUBLIC_API_URL` no Vercel e seu redeploy, `FRONTEND_URL` no Render, HTTPS e domínio exato usado. No navegador, `/api/auth/login` e `/api/auth/me` devem passar pelo domínio do próprio site e aceitar o cookie. |
| API responde 401 após login | Confirme que o login e `/auth/me` usam a mesma origem web, que cookies não estão bloqueados e que a API está em produção com `JWT_SECRET` consistente entre instâncias. |
| API retorna erro de CORS | Confira `FRONTEND_URL` no Render: esquema, domínio e ausência de barra final; inclua origens adicionais separadas por vírgula apenas se forem necessárias. |
| API mostra banco desconectado ou falha ao iniciar | Revise `DATABASE_URL`, `DIRECT_URL`, TLS/SSL e acesso do projeto Neon. Confirme se as URLs pertencem à mesma branch. |
| Migration falha no deploy | Use `DIRECT_URL` sem pooler para migrations e verifique `npx prisma migrate status`. Não rode `migrate reset` em produção. |
| Rádio não lista faixas | Confira se existem MP3s na raiz configurada, `RADIO_MUSIC_DIR`, volume do Render e permissões de leitura. MP3s não acompanham o deploy no GitHub; um Persistent Disk evita a perda normal em deploys, mas não substitui backups próprios. |
| Rádio aparece, mas não toca | Confirme que o stream público está acessível e que o volume preserva os arquivos. O navegador pode exigir um clique em Play para liberar áudio. |
| Arquivo enviado retorna `STORAGE_NOT_CONFIGURED` | Configure `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY` e `STORAGE_SECRET_KEY` no serviço da API e reinicie/redeploy. |
| Estilos não aparecem | Verifique Tailwind/PostCSS em `apps/web`, logs do build e se o deploy compilou o commit esperado. |
| Alteração de variável não surtiu efeito na web | Variáveis `NEXT_PUBLIC_*` são compiladas no build; atualize no Vercel e dispare um novo deploy. |

## Documentação complementar

- `docs/AUDITORIA_COMPLETA.md` — auditoria técnica detalhada do projeto.
- `docs/PROJECT_STATUS.md` — estado e progresso do projeto.
- `Enxamistas_Documento_Mestre_Requisitos_Completo.pdf` — documento de requisitos do produto incluído na raiz do repositório.
- Schema e histórico de dados: `apps/api/prisma/schema.prisma` e `apps/api/prisma/migrations/`.
- Rotas da API: `apps/api/src/routes/`.
