.PHONY: install dev build test lint typecheck up down logs prisma-generate

install: ## Instala dependências do workspace
	pnpm install

prisma-generate: ## Gera o Prisma Client
	pnpm --filter @helix/api prisma:generate

dev: ## Roda API e Web em modo desenvolvimento
	pnpm dev

build: ## Build de produção (api + web)
	pnpm build

test: ## Roda todos os testes
	pnpm test

lint: ## Lint de api + web
	pnpm lint

typecheck: ## Checagem de tipos
	pnpm typecheck

up: ## Sobe tudo via docker compose (bancos + api + web)
	docker compose up -d --build

down: ## Derruba os containers e remove volumes
	docker compose down -v

logs: ## Acompanha os logs da API
	docker compose logs -f api
