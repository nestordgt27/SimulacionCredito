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

| Archivo                        | Exporta                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| `periodicidad.ts`              | `Periodicidad` y `PERIODICIDADES`: estrategia por periodicidad `{ n, avanzarFecha }`        |
| `estado-solicitud.ts`          | `EstadoSolicitud`                                                                           |
| `banco.ts`, `tipo-empleo.ts`   | `Banco`, `TipoEmpleo`                                                                       |
| `cuota-nivelada.ts`            | `calcularCuotaNivelada(monto, tasaAnual, cuotas, periodicidad)`                             |
| `plan-pagos.ts`                | `generarPlanPagos({ monto, tasaAnual, cuotas, periodicidad, fechaInicio })` → `CuotaPlan[]` |
| `edad.ts`                      | `calcularEdad(fechaNacimiento, fechaReferencia)`                                            |
| `plazo.ts`                     | `calcularPlazoMeses(cuotas, periodicidad)`                                                  |
| `fechas.ts`, `validaciones.ts` | Internos (no se exportan en `index.ts`)                                                     |

- Los enums son objetos `const` con un tipo del mismo nombre, en lugar de `enum` de TypeScript. Se guardan como texto (SQLite no tiene enums), sirven para `z.enum(...)` en la web y cumplen `erasableSyntaxOnly`.
- Los cálculos usan `decimal.js`. Los montos entran y salen como `number` en unidades monetarias con 2 decimales; la conversión a centavos para persistir es responsabilidad del backend.
- Las entradas inválidas lanzan `RangeError`. El backend las valida antes con DTOs y errores de dominio, así que aquí son la última barrera.
- Se compila con **tsup** en doble formato: CommonJS (`dist/index.cjs`) para NestJS y ESM (`dist/index.js`) para Vite. El campo `exports` de `package.json` elige el formato según quién lo importe.
- Pruebas con Vitest y umbral de cobertura del **100 %**.

## `apps/api` (NestJS)

```
apps/api/
├── data/                 # SQLite local (dev.db, test.db). Ignorado por Git
├── prisma.config.ts      # Ubicación del schema y migraciones; carga .env
├── src/
│   ├── core/                 # Kernel compartido (CoreModule global)
│   │   ├── auth/             # @Public(), @UsuarioActual(), UsuarioAutenticado
│   │   ├── config/           # Validación de variables de entorno (zod)
│   │   ├── domain/           # Puertos Clock y UnitOfWork, ErrorDeDominio
│   │   ├── health/           # GET /api/health (público)
│   │   ├── http/             # configureApp (prefijo /api, CORS) y filtro de errores de dominio
│   │   └── infrastructure/   # SystemClock
│   ├── modules/
│   │   ├── auth/             # Implementado: login, refresh, logout, JwtAuthGuard global
│   │   ├── solicitudes/      # Esqueleto
│   │   ├── comite/           # Esqueleto
│   │   ├── desembolsos/      # Esqueleto
│   │   └── creditos/         # Esqueleto
│   ├── prisma/               # PrismaModule global: PrismaService, UnitOfWork, schema, migraciones, seed
│   ├── app.module.ts
│   └── main.ts
└── test/
    ├── integration/      # Integración con SQLite real (*.int-spec.ts)
    ├── support/          # FakeClock, FakeUnitOfWork, builders y puertos mockeados
    ├── setup-env.ts      # Fuerza .env.test antes de cargar la app
    └── *.e2e-spec.ts     # E2E con Supertest
```

- **Configuración**: `@nestjs/config` global. Con `NODE_ENV=test` (lo define Jest) se carga `.env.test`; si no, `.env`. `validateEnv` rechaza el arranque si falta una variable o es inválida.
- **Prefijo global** `/api`, igual que la ruta que Nginx redirigirá cuando se dockerice.
- **Base de datos**: Prisma 6 + SQLite. Las rutas `file:` son relativas a `src/prisma/schema.prisma`, por eso `DATABASE_URL=file:../../data/dev.db`. Desarrollo y pruebas usan archivos distintos (`dev.db` y `test.db`).
- **`PrismaService`** (`src/prisma/`) es global. Lo usan solo los adaptadores de `infrastructure` y las pruebas de integración.
- **Seed de desarrollo** (`src/prisma/seed.ts`, configurado en `prisma.config.ts`): crea o restablece el usuario `admin`. La lógica vive en `src/prisma/seed/` para poder probarla en integración. Se niega a ejecutarse con `NODE_ENV=production`.
- **`PasswordHasher`** (`modules/auth/domain`) con el adaptador `Argon2PasswordHasher` (`modules/auth/infrastructure`, Argon2id vía `@node-rs/argon2`, con binarios precompilados para Windows y Linux/Alpine). Lo usan el seed y el login.
- Los módulos de negocio (`auth`, `solicitudes`, `comite`, `desembolsos`, `creditos`) siguen la estructura por capas de `CLAUDE.md` §2.2. Los cuatro últimos son esqueletos que se completan en ramas propias.
- **Errores de dominio**: heredan de `ErrorDeDominio` (`core/domain`) con un `tipo` y un `codigo` estable. `ErroresDeDominioFilter` (global) los traduce a HTTP: `NO_AUTENTICADO` → 401, `NO_ENCONTRADO` → 404, `CONFLICTO` → 409, `REGLA_NEGOCIO` → 422. El cuerpo es `{ statusCode, error, message }`.
- **Validación HTTP**: `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) sobre DTOs con `class-validator`.
- **`UnitOfWork`**: `PrismaUnitOfWork` abre `prisma.$transaction` y guarda el cliente transaccional en un `AsyncLocalStorage` (`PrismaTransactionContext`). Los repositorios usan `contexto.cliente` y participan de la transacción sin recibirla como parámetro. Las llamadas anidadas reutilizan la transacción en curso.
- **Aislamiento de pruebas**: Prisma Client carga `.env` por su cuenta al importarse, y `ConfigModule` no sobrescribe variables ya definidas. Por eso `test/setup-env.ts` (en `setupFiles` de las tres configuraciones de Jest) carga `.env.test` con prioridad, y `limpiarBaseDeDatos` se niega a operar si `DATABASE_URL` no apunta a `test.db`.

## Módulo `auth`

| Capa             | Contenido                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain`         | Entidades `Usuario` y `RefreshToken`; errores; puertos `UsuarioRepository`, `RefreshTokenRepository`, `PasswordHasher`, `TokenService` y `RefreshTokenGenerator` |
| `application`    | `IniciarSesionUseCase`, `RefrescarSesionUseCase`, `CerrarSesionUseCase` y `EmisorDeSesion` (emite el par de tokens, compartido por login y refresh)              |
| `infrastructure` | `JwtTokenService` (`@nestjs/jwt`, HS256), `CryptoRefreshTokenGenerator` (256 bits, SHA-256), `Argon2PasswordHasher` y repositorios Prisma                        |
| `presentation`   | `AuthController`, DTOs y `JwtAuthGuard` (registrado como `APP_GUARD`)                                                                                            |

- **Tiempo:** `JwtTokenService` calcula `iat`/`exp` y verifica con el `Clock`, no con la hora del sistema. Así la expiración es determinista en pruebas.
- **Rotación atómica:** `RefrescarSesionUseCase` corre dentro del `UnitOfWork` y devuelve un resultado en lugar de lanzar dentro de la transacción. Así la revocación de la familia se confirma antes de responder `401`.
- **Concurrencia:** `marcarRotado` es un `updateMany` condicionado a `revocadoEn IS NULL`. Si dos peticiones rotan el mismo token, solo una lo logra y la otra se trata como reutilización.

## Modelo de datos

```
Usuario ─┬─< RefreshToken (cascade; rotación por familiaId)
         ├─< Solicitud (creadaPor / evaluadaPor)
         ├─< SolicitudHistorial
         └─< Desembolso

Cliente ──< Solicitud ──< SolicitudHistorial
                │
                └── 1:1 ── Credito ──< CuotaPlan
                              │
                              └── 1:1 ── Desembolso

Secuencia (contador del número de crédito por año)
```

| Convención | Detalle                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Montos     | Centavos (`Int`). El dominio convierte a unidades para llamar a `shared`                                         |
| Tasas      | Puntos básicos (`Int`): `tasaAnual = tasaAnualBps / 100`                                                         |
| Enums      | `String`, validados con los enums de `shared`                                                                    |
| Borrado    | `Restrict` en datos financieros; `Cascade` solo en `RefreshToken`                                                |
| Unicidad   | Cédula, número de crédito, un crédito por solicitud, un desembolso por crédito, `(creditoId, numero)` en el plan |
| Derivados  | Edad y plazo no se guardan; se calculan con `calcularEdad` y `calcularPlazoMeses`                                |

- **Solicitud vs. crédito:** la solicitud es la petición; el crédito es lo pactado. Al aprobar se copian las condiciones al crédito como contrato inmutable.
- **`CuotaPlan`** usa los mismos nombres que el `CuotaPlan` de `generarPlanPagos` (`numero`, `cuota`, `capital`, `interes`, `saldo`), con el sufijo `Centavos`.
- Migraciones en `src/prisma/migrations/`.

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

| Paquete  | Unitarias                                        | Integración / e2e                                                                                                                 |
| -------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `shared` | Vitest                                           | —                                                                                                                                 |
| `api`    | Jest (`src/**/*.spec.ts`), con puertos mockeados | Integración: Jest + SQLite real (`test/**/*.int-spec.ts`). E2E: Jest + Supertest (`test/**/*.e2e-spec.ts`). Ambas con `.env.test` |
| `web`    | Vitest + Testing Library + jsdom                 | —                                                                                                                                 |
