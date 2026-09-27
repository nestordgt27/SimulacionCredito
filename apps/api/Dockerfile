# syntax=docker/dockerfile:1
# API NestJS. Contexto de build: raíz del monorepo (docker compose lo configura así),
# porque la API depende del workspace packages/shared.

# Debian slim (glibc): Prisma y @node-rs/argon2 traen binarios precompilados para glibc.
FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# --- Build: dependencias del workspace, cliente de Prisma y compilación ---
FROM base AS build
# Primero solo los manifiestos y shared: la capa de npm ci se reutiliza mientras no cambien.
# npm ci necesita los package.json de todos los workspaces que figuran en el lockfile.
COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
# El postinstall de la raíz compila packages/shared.
RUN npm ci --no-audit --no-fund \
  -w @simulacion-credito/shared -w @simulacion-credito/api --include-workspace-root

COPY apps/api ./apps/api
# Después de compilar se dejan solo las dependencias de ejecución de estos workspaces
# (prisma y dotenv lo son: las migraciones se aplican al arrancar). Sin -w, prune
# agregaría las dependencias de la web.
RUN npm run prisma:generate -w @simulacion-credito/api \
  && npm run build -w @simulacion-credito/api \
  && npm prune --omit=dev --no-audit --no-fund \
    -w @simulacion-credito/shared -w @simulacion-credito/api --include-workspace-root

# --- Runtime ---
FROM base AS runtime
# CHECKPOINT_DISABLE y PRISMA_HIDE_UPDATE_MESSAGE: sin telemetría ni avisos de Prisma.
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:/app/data/credito.db \
    CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1

# node_modules conserva los enlaces de los workspaces (@simulacion-credito/shared → packages/shared).
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/api/package.json /app/apps/api/prisma.config.ts ./apps/api/
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/src/prisma/schema.prisma ./apps/api/src/prisma/
COPY --from=build /app/apps/api/src/prisma/migrations ./apps/api/src/prisma/migrations

# Carpeta del archivo SQLite: docker-compose monta aquí un volumen (hereda este dueño).
RUN mkdir -p /app/data && chown node:node /app/data
USER node
WORKDIR /app/apps/api
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://localhost:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Al arrancar: aplica las migraciones pendientes, siembra el usuario de prueba si se pidió
# (SEMBRAR_USUARIO_PRUEBA=true, idempotente) y reemplaza el shell por Node (recibe las señales).
CMD ["sh", "-c", "/app/node_modules/.bin/prisma migrate deploy && if [ \"$SEMBRAR_USUARIO_PRUEBA\" = \"true\" ]; then node dist/prisma/seed.js; fi && exec node dist/main.js"]
