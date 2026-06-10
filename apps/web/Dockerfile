# syntax=docker/dockerfile:1
# Build a partir da raiz do repositório: docker build -f apps/web/Dockerfile .

FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@8.7.4 --activate
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --filter "@helix/web..."

COPY apps/web ./apps/web
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN cd apps/web && pnpm build

FROM nginx:1.27-alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
