# Arquitectura

Resumen de la arquitectura del monorepo. Las reglas normativas (capas, SOLID, pruebas, Git) están en [`CLAUDE.md`](../CLAUDE.md); este documento describe cómo están implementadas.

## Monorepo

- **npm workspaces**: `packages/*` y `apps/*` (en ese orden, para que `shared` se compile primero en `npm run build`).
- `npm install` ejecuta `postinstall`, que compila `packages/shared`.
- Una sola versión de TypeScript (`~5.9.3`) y una configuración de Prettier en la raíz.

```
apps/api  ──┐
            ├──> packages/shared
apps/web  ──┘
```

## `packages/shared`

- Funciones puras y tipos: cálculos financieros, enums y validaciones.
- Se compila con **tsup** en doble formato: CommonJS (`dist/index.cjs`) para NestJS y ESM (`dist/index.js`) para Vite. El campo `exports` de `package.json` elige el formato según quién lo importe.
- Pruebas con Vitest y umbral de cobertura del **100 %**.

## `apps/api` (NestJS)

```
apps/api/
├── data/                 # SQLite local (dev.db, test.db). Ignorado por Git
├── prisma.config.ts      # Ubicación del schema y migraciones; carga .env
├── src/
│   ├── core/
│   │   ├── config/       # Validación de variables de entorno (zod)
│   │   ├── health/       # GET /api/health
│   │   └── http/         # Configuración HTTP común (prefijo /api, CORS)
│   ├── modules/          # Módulos de negocio (domain / application / infrastructure / presentation)
│   ├── prisma/           # schema.prisma y migraciones
│   ├── app.module.ts
│   └── main.ts
└── test/                 # Pruebas e2e (Supertest)
```

- **Configuración**: `@nestjs/config` global. Con `NODE_ENV=test` (lo define Jest) se carga `.env.test`; si no, `.env`. `validateEnv` rechaza el arranque si falta una variable o es inválida.
- **Prefijo global** `/api`, igual que la ruta que Nginx redirigirá cuando se dockerice.
- **Base de datos**: Prisma 6 + SQLite. Las rutas `file:` son relativas a `src/prisma/schema.prisma`, por eso `DATABASE_URL=file:../../data/dev.db`. Desarrollo y pruebas usan archivos distintos (`dev.db` y `test.db`).
- Los módulos de negocio (`auth`, `solicitudes`, `comite`, `desembolsos`, `creditos`) siguen la estructura por capas de `CLAUDE.md` §2.2 y se agregan en ramas propias.

## `apps/web` (React + Vite)

```
apps/web/src/
├── app/          # App, providers (TanStack Query), rutas, layout
├── features/     # Una carpeta por feature (se agregan a medida que se implementan)
├── shared/       # Cliente HTTP, UI reutilizable, utilidades
└── test/         # Setup de Vitest + Testing Library
```

- **Proxy de desarrollo**: Vite redirige `/api` a `API_PROXY_TARGET` (por defecto `http://localhost:3000`). El frontend siempre llama a rutas relativas `/api/...`, igual que detrás de Nginx.
- **Rutas**: `app/routes.tsx` define las rutas como datos (`RouteObject[]`). Así las pruebas las montan con `createMemoryRouter` sin duplicarlas.

## Pruebas

| Paquete  | Unitarias                        | Integración / e2e                                           |
| -------- | -------------------------------- | ----------------------------------------------------------- |
| `shared` | Vitest                           | —                                                           |
| `api`    | Jest (`src/**/*.spec.ts`)        | Jest + Supertest (`test/**/*.e2e-spec.ts`), con `.env.test` |
| `web`    | Vitest + Testing Library + jsdom | —                                                           |
