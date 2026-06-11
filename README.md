# Helix

[![CI](https://github.com/ricardovac/helix/actions/workflows/ci.yml/badge.svg)](https://github.com/ricardovac/helix/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

Plataforma de **chatbot com IA** construída como projeto de demonstração técnica.
Monorepo com **NestJS** (clean architecture / ports & adapters) e **React + Vite**,
integração com **Azure OpenAI** e **AWS Bedrock** (+ provider _mock_ offline), **PostgreSQL + MongoDB + Redis**,
**autenticação JWT**, streaming via **WebSocket**, **observabilidade** (Prometheus + Grafana,
health checks, logs estruturados), **testes automatizados** e **CI/CD** com Docker.

> Provider de IA padrão é o `mock` — sobe e funciona **sem nenhuma credencial**.
> Trocar para Azure OpenAI é só mudar variáveis de ambiente (nenhuma linha de código).

---

## Como os requisitos da vaga são atendidos

| Requisito | Onde está no projeto |
|---|---|
| **React** | `apps/web` — SPA em React 18 + Vite, chat com streaming token a token |
| **Node.js** | `apps/api` — NestJS (Node 20) |
| **JavaScript / TypeScript** | TypeScript estrito (`strict: true`) em todo o monorepo |
| **Integração com APIs de IA (Azure OpenAI / AWS AI)** | `apps/api/src/chat/infrastructure/ai/` — adapters `AzureOpenAiProvider` (SDK `openai`) e `BedrockAiProvider` (AWS Converse API) atrás de um _port_ `AiProvider`; troca de provider em 1 ponto (`ai-provider.factory.ts`) |
| **DevOps (CI/CD, containers, automação)** | `Dockerfile` multi-stage (api/web), `docker-compose.yml` (5 serviços), `.github/workflows/ci.yml` (lint→typecheck→test→build→docker), `Makefile` |
| **Bancos relacionais e NoSQL** | **Postgres** (Prisma) para conversas/usuários · **MongoDB** (Mongoose) para o histórico de mensagens · **Redis** para cache e rate limiting |
| _Cloud (AWS/Azure/GCP)_ | Integração com **Azure OpenAI**; imagens Docker prontas para deploy em qualquer cloud |
| _MLOps / orquestração de modelos_ | Abstração `AiProvider` + factory = ponto único de orquestração/troca entre **3 providers** (Azure OpenAI, AWS Bedrock, mock) sem tocar o domínio |
| _Microserviços / arquitetura limpa_ | Camadas **domain → application → infrastructure → presentation**; domínio sem dependência de framework/infra |
| _Testes automatizados e observabilidade_ | Jest (unit + e2e) na API, Vitest + Testing Library no front; `/metrics` (Prometheus) + **Grafana** com dashboard provisionado, `/health/{live,ready}` (Terminus), logs JSON com `request-id` (pino) |
| _Segurança / autenticação_ | **JWT** (Passport) com registro/login, senhas com bcrypt, rotas REST e canal WebSocket protegidos, conversas isoladas por usuário |

---

## Arquitetura

```
┌──────────────┐        REST + WebSocket        ┌─────────────────────────────┐
│  React (web) │ ─────────────────────────────▶ │         NestJS (api)        │
│  Vite + TS   │ ◀───────  stream de tokens ──── │                             │
└──────────────┘                                 │  presentation               │
                                                 │   ├─ AuthController (JWT)   │
                                                 │   ├─ ChatController (REST)  │
                                                 │   └─ ChatGateway (WS·auth)  │
                                                 │  application (use cases)    │
                                                 │   └─ SendMessageUseCase ... │
                                                 │  domain (entities + ports)  │
                                                 │   ├─ AiProvider             │
                                                 │   ├─ ConversationRepository │
                                                 │   └─ MessageStore           │
                                                 │  infrastructure (adapters)  │
                                                 │   ├─ Azure · Bedrock · Mock │
                                                 │   ├─ Prisma  → Postgres     │
                                                 │   ├─ Mongoose → MongoDB     │
                                                 │   └─ Redis (cache)          │
                                                 └──────┬──────────┬───────────┘
                                                        │          │
                                       ┌────────────────▼──┐  ┌────▼─────┐  ┌─────────┐
                                       │   PostgreSQL      │  │ MongoDB  │  │  Redis  │
                                       │ conversas/usuários│  │ mensagens│  │  cache  │
                                       └───────────────────┘  └──────────┘  └─────────┘
```

**Regra de dependência (clean architecture):** o domínio (`domain/`) só conhece as suas
interfaces (_ports_). A aplicação (`application/`) depende dos _ports_, nunca das
implementações. Os adapters concretos (Azure, Prisma, Mongo, Redis) vivem em
`infrastructure/` e são injetados via tokens no `chat.module.ts`. Prova concreta:
os três providers de IA (Azure OpenAI, AWS Bedrock e mock) implementam o mesmo
`AiProvider` e foram adicionados **sem tocar uma linha do domínio** — trocar de
banco seguiria o mesmo caminho.

---

## Stack

| Camada | Tecnologias |
|---|---|
| Front-end | React 18, Vite, TypeScript, Tailwind, socket.io-client, Vitest, Testing Library |
| Back-end | NestJS 10, TypeScript, Prisma, Mongoose, ioredis, socket.io, Swagger, Throttler |
| Auth | Passport + JWT (`@nestjs/jwt`), bcryptjs |
| IA | SDK `openai` (Azure OpenAI), `@aws-sdk/client-bedrock-runtime` (AWS Bedrock) + provider mock |
| Observabilidade | nestjs-pino, prom-client, @nestjs/terminus, Prometheus, Grafana |
| Dados | PostgreSQL 16, MongoDB 7, Redis 7 |
| DevOps | Docker multi-stage, docker-compose, GitHub Actions, pnpm workspaces |

---

## Rodando o projeto

### Opção 1 — Docker (stack completa, recomendado)

```bash
docker compose up -d --build
```

- Web:        http://localhost:8080
- API:        http://localhost:3000
- Swagger:    http://localhost:3000/docs
- Métricas:   http://localhost:3000/metrics
- Prometheus: http://localhost:9090
- Grafana:    http://localhost:3001 (admin / admin) — dashboard "Helix" já provisionado

Derrubar: `docker compose down -v` (ou `make down`).

### Opção 2 — Desenvolvimento local

```bash
pnpm install
cp .env.example .env                 # ajuste se quiser
docker compose up -d postgres mongo redis   # só os bancos
pnpm --filter @helix/api prisma:push   # cria o schema no Postgres
pnpm dev                             # API (3000) + Web (5173) em paralelo
```

Atalhos no `Makefile`: `make install`, `make dev`, `make test`, `make up`, `make down`.

---

## Variáveis de ambiente

Ver `.env.example`. As principais:

| Variável | Default | Descrição |
|---|---|---|
| `AI_PROVIDER` | `mock` | `mock` (offline), `azure` ou `bedrock` |
| `AZURE_OPENAI_ENDPOINT` | — | Endpoint do recurso Azure OpenAI |
| `AZURE_OPENAI_API_KEY` | — | Chave da API |
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-4o-mini` | Nome do _deployment_ |
| `AWS_REGION` | `us-east-1` | Região do Bedrock |
| `AWS_BEDROCK_MODEL_ID` | `anthropic.claude-3-haiku-…` | Modelo do Bedrock |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | — | Credenciais AWS (ou use IAM role / `~/.aws`) |
| `DATABASE_URL` | postgres local | Conexão Postgres (Prisma) |
| `MONGO_URL` | mongo local | Conexão MongoDB |
| `REDIS_URL` | redis local | Conexão Redis |

A configuração é **validada no boot com Zod** (`apps/api/src/config/configuration.ts`):
a API não sobe com env inválida, e exige endpoint+key quando `AI_PROVIDER=azure`.

### Trocar para Azure OpenAI

```env
AI_PROVIDER=azure
AZURE_OPENAI_ENDPOINT=https://<seu-recurso>.openai.azure.com
AZURE_OPENAI_API_KEY=<sua-chave>
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
```

### Trocar para AWS Bedrock

```env
AI_PROVIDER=bedrock
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
# credenciais via env, IAM role (ECS/EKS) ou ~/.aws
AWS_ACCESS_KEY_ID=<...>
AWS_SECRET_ACCESS_KEY=<...>
```

Em ambos os casos, **nenhuma mudança de código** — o `aiProviderFactory` seleciona o
adapter conforme `AI_PROVIDER`. Adicionar um novo provider = um adapter que implementa
`AiProvider` + um `case` na factory.

---

## API

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `POST` | `/auth/register` | — | Cria conta e retorna o token JWT |
| `POST` | `/auth/login` | — | Autentica e retorna o token JWT |
| `GET` | `/auth/me` | 🔒 | Usuário autenticado |
| `POST` | `/conversations` | 🔒 | Cria uma conversa |
| `GET` | `/conversations` | 🔒 | Lista as conversas do usuário |
| `GET` | `/conversations/:id` | 🔒 | Conversa + histórico de mensagens |
| `POST` | `/conversations/:id/messages` | 🔒 | Envia mensagem (resposta completa) |
| `GET` | `/health/live` · `/health/ready` | — | Liveness / readiness |
| `GET` | `/metrics` | — | Métricas Prometheus |
| `GET` | `/docs` | — | Swagger UI |

🔒 = exige header `Authorization: Bearer <token>`.

**Autenticação:** `register`/`login` devolvem `{ accessToken, user }`. Envie o token no
header `Authorization` (REST) ou em `auth: { token }` no handshake do socket. Conversas
são isoladas por usuário — acessar a de outro retorna 404.

**WebSocket** (namespace `/chat`, autenticado por JWT no handshake): emita `message`
`{ conversationId, content }` e receba os eventos `token` (parciais) e `done`
(mensagem final persistida).

---

## Observabilidade

- **Logs** estruturados em JSON (pino), com `x-request-id` por requisição.
- **Métricas** Prometheus: `http_requests_total`, `http_request_duration_seconds`,
  `ai_completions_total`, `ai_tokens_total`, `ai_completion_duration_seconds`.
- **Prometheus** (`:9090`) raspa o `/metrics` e **Grafana** (`:3001`) sobe com
  datasource + dashboard já provisionados (`infra/grafana`, `infra/prometheus`):
  taxa e latência (p95) de HTTP, completions/s por status, latência da IA e tokens consumidos.
- **Health checks** (Terminus) verificando Postgres, MongoDB e Redis.

---

## Testes

```bash
pnpm test          # unit (Jest na API + Vitest no Web)
pnpm --filter @helix/api test:e2e   # e2e do contrato REST (sem banco)
```

- API (20 unit + 5 e2e): casos de uso com _ports_ falsos, registro/login (hash + token),
  seleção dos 3 providers de IA (factory), mapeamento da Converse API (Bedrock),
  validação de config e e2e da camada HTTP (ValidationPipe + guard + rotas).
- Web: testes de componente com Testing Library.

---

## Estrutura

```
.
├── apps
│   ├── api                     # NestJS (clean architecture)
│   │   ├── prisma/schema.prisma
│   │   └── src
│   │       ├── auth                # JWT: register/login, guard, strategy
│   │       │   ├── domain · application · infrastructure · presentation
│   │       ├── chat
│   │       │   ├── domain          # entities + ports (interfaces)
│   │       │   ├── application      # use cases
│   │       │   ├── infrastructure   # adapters: ai, prisma, mongo
│   │       │   └── presentation     # controller, gateway, dtos
│   │       ├── config              # validação de env (zod)
│   │       ├── health              # liveness/readiness
│   │       ├── infra               # prisma, redis
│   │       └── observability       # métricas prometheus
│   └── web                     # React + Vite
│       └── src
│           ├── components          # AuthScreen, ChatApp, MessageBubble...
│           ├── hooks               # useAuth, useChat
│           └── lib                 # api client, auth, socket, token
├── infra
│   ├── prometheus/prometheus.yml
│   └── grafana/                # datasource + dashboard provisionados
├── docker-compose.yml
├── Makefile
└── .github/workflows/ci.yml
```

---

## Decisões de design

- **Postgres _e_ Mongo de propósito:** conversas/usuários são dados relacionais
  (relações, contadores); mensagens são um _stream_ append-only de documentos —
  caso de uso natural para banco de documentos. Demonstra os dois mundos com a
  ferramenta certa para cada um.
- **Boot resiliente:** Redis e Postgres sobem em modo degradado se indisponíveis;
  o `/health/ready` reporta o estado real (ótimo para Kubernetes).
- **Cache com invalidação:** `findById` da conversa usa cache no Redis e invalida
  ao registrar novas mensagens.
- **Provider de IA como _port_:** três adapters (Azure OpenAI, AWS Bedrock, mock)
  atrás da mesma interface viabilizam orquestração/troca de modelos por env e mantêm
  o domínio testável sem rede (provider mock). A Bedrock usa a **Converse API**, que
  unifica vários modelos (Claude, Titan, Llama) sob um único contrato de mensagens.
- **Autenticação e isolamento:** JWT stateless; senhas com bcrypt; o mesmo token
  protege REST e WebSocket. Conversas são escopadas por usuário e "não é dono" vira
  404 (não vaza existência de recurso).
