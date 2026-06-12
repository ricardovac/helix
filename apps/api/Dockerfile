# syntax=docker/dockerfile:1
# Build a partir da raiz do repositório (pnpm workspace): docker build -f apps/api/Dockerfile .

# ── Builder ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
# openssl: necessário para o Prisma detectar/carregar o engine certo (OpenSSL 3).
RUN apk add --no-cache openssl && corepack enable && corepack prepare pnpm@8.7.4 --activate
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --filter "@helix/api..."

COPY apps/api ./apps/api
RUN cd apps/api && pnpm prisma generate && pnpm build

# ── Runner ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl && corepack enable && corepack prepare pnpm@8.7.4 --activate
WORKDIR /repo
ENV NODE_ENV=production

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
COPY --from=builder /repo/apps/api/package.json ./apps/api/package.json
COPY --from=builder /repo/apps/api/prisma ./apps/api/prisma

WORKDIR /repo/apps/api
EXPOSE 3000
# Aplica as migrations e sobe a API.
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]
