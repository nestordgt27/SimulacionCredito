# syntax=docker/dockerfile:1
# Web React + Vite servida por Nginx. Contexto de build: raíz del monorepo
# (docker compose lo configura así), porque la web depende del workspace packages/shared.

# --- Build: dependencias del workspace y build estático de Vite ---
FROM node:22-bookworm-slim AS build
WORKDIR /app
# Primero solo los manifiestos y shared: la capa de npm ci se reutiliza mientras no cambien.
# npm ci necesita los package.json de todos los workspaces que figuran en el lockfile.
COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
# El postinstall de la raíz compila packages/shared.
RUN npm ci --no-audit --no-fund \
  -w @simulacion-credito/shared -w @simulacion-credito/web --include-workspace-root

COPY apps/web ./apps/web
RUN npm run build -w @simulacion-credito/web

# --- Runtime: Nginx sirve los estáticos y hace de proxy de /api hacia el servicio api ---
FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
