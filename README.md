# Simulación de Crédito

Monorepo que simula el ciclo de vida de una solicitud de crédito: registro de la solicitud, revisión del comité (aprobación o rechazo), desembolso y consulta del crédito con su plan de pagos.

> Las reglas de arquitectura, pruebas y Git están en [`CLAUDE.md`](CLAUDE.md). La bitácora de uso de IA está en [`docs/AI_LOG.md`](docs/AI_LOG.md).

## Estructura

```
apps/
  api/        API NestJS + Prisma + SQLite
  web/        Frontend React + Vite
packages/
  shared/     Cálculos financieros, enums y validaciones puras (usado por api y web)
docs/         Arquitectura y bitácora de IA
```

Más detalle en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Requisitos

- Node.js **22.12 o superior** (ver `.nvmrc`)
- npm 10 o superior

## Puesta en marcha (desarrollo local)

> Mientras los proyectos no estén dockerizados, la base de datos es un archivo SQLite local en `apps/api/data/`.

```bash
# 1. Instalar dependencias (también compila packages/shared)
npm install

# 2. Crear las variables de entorno locales a partir de las plantillas
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Generar el cliente de Prisma
npm run prisma:generate -w @simulacion-credito/api

# 4. Levantar api (http://localhost:3000/api) y web (http://localhost:5173)
npm run dev
```

La web redirige `/api` a la API mediante el proxy de Vite, así que en el navegador todo se sirve desde `http://localhost:5173`.

## Variables de entorno

| Archivo                 | Versionado | Uso                                                         |
| ----------------------- | ---------- | ----------------------------------------------------------- |
| `apps/api/.env.example` | Sí         | Plantilla para desarrollo                                   |
| `apps/api/.env`         | No         | Configuración local de desarrollo (`data/dev.db`)           |
| `apps/api/.env.test`    | Sí         | Pruebas de integración y e2e (`data/test.db`); sin secretos |
| `apps/web/.env.example` | Sí         | Plantilla del frontend                                      |
| `apps/web/.env`         | No         | Configuración local del frontend                            |

Variables de la API:

| Variable       | Ejemplo                  | Descripción                                        |
| -------------- | ------------------------ | -------------------------------------------------- |
| `NODE_ENV`     | `development`            | `development`, `test` o `production`               |
| `PORT`         | `3000`                   | Puerto HTTP de la API                              |
| `DATABASE_URL` | `file:../../data/dev.db` | Ruta SQLite, relativa a `src/prisma/schema.prisma` |
| `CORS_ORIGIN`  | `http://localhost:5173`  | Origen permitido del frontend                      |

Las variables se validan al arrancar: si falta alguna o es inválida, la API no inicia.

Variables del frontend:

| Variable           | Ejemplo                 | Descripción                      |
| ------------------ | ----------------------- | -------------------------------- |
| `API_PROXY_TARGET` | `http://localhost:3000` | Destino del proxy `/api` de Vite |

## Scripts (desde la raíz)

| Script                                        | Descripción                             |
| --------------------------------------------- | --------------------------------------- |
| `npm run dev`                                 | Levanta api y web en paralelo           |
| `npm run build`                               | Compila shared, api y web               |
| `npm test`                                    | Pruebas unitarias de todos los paquetes |
| `npm run test:e2e -w @simulacion-credito/api` | Pruebas e2e de la API (usa `.env.test`) |
| `npm run lint`                                | Lint de todos los paquetes              |
| `npm run typecheck`                           | `tsc` sin emitir en todos los paquetes  |
| `npm run format`                              | Formatea con Prettier                   |

Base de datos (`-w @simulacion-credito/api`):

| Script                | Descripción                                   |
| --------------------- | --------------------------------------------- |
| `prisma:generate`     | Genera el cliente de Prisma                   |
| `prisma:migrate`      | Crea y aplica migraciones sobre `data/dev.db` |
| `prisma:migrate:test` | Aplica las migraciones sobre `data/test.db`   |
| `prisma:studio`       | Abre Prisma Studio                            |

## Supuestos

Supuestos técnicos del entorno. Los supuestos de negocio se agregan a medida que se implementan (ver `CLAUDE.md` §4).

- **Versiones fijadas por compatibilidad con Node 22.13:** NestJS 11 (el CLI 12 falla en esta versión de Node), Prisma 6 (Prisma 8 exige Node ≥ 22.18), React Router 7 (la 8 exige Node ≥ 22.22) y TypeScript 5.9 (`ts-jest` aún no soporta TypeScript 7).
- **SQLite local en `apps/api/data/`** solo para desarrollo, mientras no se dockeriza. La carpeta está en `.gitignore` (salvo `.gitkeep`).
- **Linter:** ESLint con reglas de tipos en la api; oxlint en la web (el que genera la plantilla de Vite).
