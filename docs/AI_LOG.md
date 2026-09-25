# Bitácora de uso de IA

Registro de cada interacción con herramientas de IA durante el desarrollo, según la sección 8 de `CLAUDE.md`.

## Registro de ramas

| Rama | Propósito | Creada desde | PR | Estado |
|---|---|---|---|---|
| `main` | Commit inicial: `.gitignore`, `LICENSE` | — | — | Activa |
| `develop` | Rama de integración | `main` | — | Activa |
| `docs/instrucciones-proyecto` | Agregar `CLAUDE.md` y `docs/AI_LOG.md` | `develop` | [#1](https://github.com/nestordgt27/SimulacionCredito/pull/1) | Fusionada |
| `chore/estructura-monorepo` | Estructura del monorepo, SQLite local y variables de entorno | `develop` | [#2](https://github.com/nestordgt27/SimulacionCredito/pull/2) | Fusionada |
| `feature/shared-calculos-financieros` | Cálculos financieros y enums en `packages/shared` | `develop` | [#3](https://github.com/nestordgt27/SimulacionCredito/pull/3) | Fusionada |
| `feature/datos-modelo-prisma` | Modelo de datos Prisma, migración inicial y pruebas de integración | `develop` | [#4](https://github.com/nestordgt27/SimulacionCredito/pull/4) | Fusionada |
| `chore/seed-usuario-admin` | Seed con usuario de prueba `admin` | `develop` | [#5](https://github.com/nestordgt27/SimulacionCredito/pull/5) | En revisión |

---

## Entradas

### [001] 2026-09-24 — Análisis de la prueba y hoja de ruta

- **Herramienta:** Claude (claude.ai)
- **Rama:** — (repositorio aún no creado)
- **Prompt (resumen fiel):** Analizar el documento de la prueba técnica y proponer el camino completo, desde la creación del repositorio en GitHub hasta la actualización final del README.
- **Resultado:** Hoja de ruta en 8 fases: decisiones y supuestos, estructura del monorepo, paquete `shared`, modelo de datos, backend NestJS, frontend React, Docker, pruebas y entrega.
- **Decisiones y ajustes manuales:** Se eligió NestJS + Prisma + SQLite y React + Vite para compartir el cálculo de la cuota entre frontend y backend. Se documentaron supuestos no definidos en el enunciado (plazo derivado, tasa 0, redondeo, fechas de vencimiento).
- **Commits:** —

### [002] 2026-09-24 — Archivo de instrucciones del proyecto

- **Herramienta:** Claude (claude.ai)
- **Rama:** `main` (commit inicial, excepción documentada en `CLAUDE.md` §7.1)
- **Prompt (resumen fiel):** Crear un archivo de instrucciones .md para leer antes de cada iteración, que defina la arquitectura, los principios SOLID, la correcta implementación de pruebas (uso de mocks), el historial de prompts y el uso correcto de Git y ramas, registrando esto último en el historial.
- **Resultado:** `CLAUDE.md` (protocolo por iteración, arquitectura hexagonal ligera, SOLID aplicado, reglas de negocio, reglas de pruebas y mocks, flujo Git, formato de bitácora, Definition of Done) y este `docs/AI_LOG.md` con tabla de ramas.
- **Decisiones y ajustes manuales:** Pendiente de revisión por el desarrollador.
- **Commits:** `docs: agregar instrucciones del proyecto y bitácora de IA` (propuesto)

### [003] 2026-09-25 — Incorporar instrucciones y bitácora al repositorio

- **Herramienta:** Claude Code
- **Rama:** `docs/instrucciones-proyecto`
- **Prompt (resumen fiel):** Crear un proyecto monorepo que simule el ciclo de vida de un crédito usando el repositorio SimulacionCredito; primero agregar en la raíz los archivos adjuntos (`CLAUDE.md`, `AI_LOG.md`) para tomarlos en cuenta en cada iteración.
- **Resultado:** `CLAUDE.md` en la raíz y bitácora en `docs/AI_LOG.md`. Tabla de ramas actualizada al estado real del repositorio.
- **Decisiones y ajustes manuales:** La bitácora se ubicó en `docs/AI_LOG.md` (no en la raíz) para cumplir la estructura de `CLAUDE.md` §2.1. Como `main` y `develop` ya existían (commit inicial con `.gitignore` y `LICENSE`), no se aplicó la excepción de commit directo a `main` (§7.1); el trabajo se hace en una rama `docs/` desde `develop`.
- **Commits:** `docs: agregar instrucciones del proyecto y bitácora de ia`, `docs(ai-log): registrar pr de instrucciones del proyecto`
- **PR:** [#1](https://github.com/nestordgt27/SimulacionCredito/pull/1) → `develop`

### [004] 2026-09-25 — Estructura del monorepo y entorno local

- **Herramienta:** Claude Code
- **Rama:** `chore/estructura-monorepo`
- **Prompt (resumen fiel):** Crear la estructura del monorepo según la documentación; agregar dentro de `api` una carpeta `data` para las bases de datos locales de desarrollo y de prueba; agregar las variables de entorno según la ruta local con `.env.example` y `.env.test` versionados; agregar al `.gitignore` el `.env` y la carpeta `data`. Solo para desarrollo mientras se dockerizan los proyectos.
- **Resultado:**
  - Raíz: npm workspaces (`packages/*`, `apps/*`), scripts globales (`dev`, `build`, `test`, `lint`, `typecheck`, `format`), Prettier, `.editorconfig`, `.gitattributes`, `.nvmrc`.
  - `packages/shared`: paquete vacío con build dual CJS/ESM (tsup) y Vitest con umbral de cobertura del 100 %.
  - `apps/api`: NestJS 11 con prefijo `/api`, CORS, `GET /api/health`, validación de variables de entorno con zod (`.env` en desarrollo, `.env.test` con `NODE_ENV=test`), Prisma 6 + SQLite (`src/prisma/schema.prisma`, `prisma.config.ts`), carpeta `data/` para `dev.db` y `test.db`. Pruebas unitarias de la validación de entorno y e2e del health check.
  - `apps/web`: React 19 + Vite 8, React Router 7, TanStack Query, rutas como datos, proxy `/api` configurable con `API_PROXY_TARGET`, Vitest + Testing Library + jsdom.
  - `.gitignore`: se ignoran `.env`, `apps/api/data/*` (salvo `.gitkeep`) y `*.db`; se versiona `.env.test`.
  - `README.md` (puesta en marcha, variables, scripts, supuestos) y `docs/ARCHITECTURE.md`.
- **Decisiones y ajustes manuales:**
  - El CLI de NestJS 12 falla con Node 22.13.1 (`ERR_REQUIRE_CYCLE_MODULE`), así que se generó con NestJS 11. También se fijaron Prisma 6 (la 8 exige Node ≥ 22.18), React Router 7 (la 8 exige Node ≥ 22.22) y TypeScript 5.9 en todo el repo (`ts-jest` no soporta TypeScript 7).
  - `DATABASE_URL` usa rutas relativas al schema (`file:../../data/dev.db`), de modo que funcionan en cualquier máquina sin rutas absolutas. Se verificó que `prisma db push` crea `dev.db` y `test.db` en `apps/api/data/`.
  - En `.gitignore` se ignora el contenido de `data/` pero se mantiene `.gitkeep` para que la carpeta exista al clonar (SQLite no crea directorios).
  - Solo se agregaron las variables de entorno que se usan hoy (`NODE_ENV`, `PORT`, `DATABASE_URL`, `CORS_ORIGIN`); las de JWT entrarán con el módulo `auth`.
  - `PrismaService` y la carpeta `features/` de la web se agregarán con el primer módulo que los use, para no dejar código muerto.
  - La configuración HTTP (prefijo y CORS) se extrajo a `core/http/configure-app.ts` para que `main.ts` y las pruebas e2e la compartan.
  - `npm audit` reporta alertas solo en herramientas de desarrollo: `deepmerge-ts` (CLI de Prisma 6; la corrección exige Prisma 7) y `esbuild` (tsup; la alerta afecta al servidor de desarrollo de esbuild, que no se usa). Se revisarán al actualizar Node/Prisma.
  - Verificación: typecheck, lint, pruebas unitarias (api 6, web 1), e2e (1), build y prueba manual de `GET /api/health` directa y a través del proxy de Vite.
- **Commits:** `chore(monorepo): configurar npm workspaces y paquete shared`, `chore(api): agregar esqueleto nestjs con prisma, sqlite local y variables de entorno`, `chore(web): agregar esqueleto react con vite, router y tanstack query`, `docs: documentar estructura del monorepo y puesta en marcha`, `docs(ai-log): registrar pr de estructura del monorepo`
- **PR:** [#2](https://github.com/nestordgt27/SimulacionCredito/pull/2) → `develop`

### [005] 2026-09-25 — Cálculos financieros en `packages/shared`

- **Herramienta:** Claude Code
- **Rama:** `feature/shared-calculos-financieros`
- **Prompt (resumen fiel):** Implementar en shared la función pura `calcularCuotaNivelada(monto, tasaAnual, cuotas, periodicidad)`; `generarPlanPagos(...)`, que devuelva por cada cuota número, fecha, cuota, interés, capital y saldo; `calcularEdad(fechaNacimiento)`; los enums `Periodicidad` y `EstadoSolicitud`, y el mapa de `n` (1, 12, 24).
- **Resultado:**
  - `Periodicidad` y `PERIODICIDADES` (estrategia `{ n, avanzarFecha }`), más `obtenerConfiguracion`, que rechaza valores no soportados en tiempo de ejecución.
  - `EstadoSolicitud` (PENDIENTE, APROBADA, RECHAZADA, DESEMBOLSADA).
  - `calcularCuotaNivelada` con `decimal.js`, que contempla tasa 0.
  - `generarPlanPagos` → `CuotaPlan[]` (`numero`, `fechaVencimiento`, `cuota`, `interes`, `capital`, `saldo`), con ajuste del residuo en la última cuota.
  - `calcularEdad` y `calcularPlazoMeses`.
  - 68 pruebas con 100 % de cobertura (sentencias, ramas, funciones y líneas).
  - Supuestos registrados en `CLAUDE.md` §4 y en el README; tabla de exports en `docs/ARCHITECTURE.md`.
- **Decisiones y ajustes manuales:**
  - **`calcularEdad` recibe también `fechaReferencia`**, a diferencia de la firma pedida (`calcularEdad(fechaNacimiento)`). Sin ella la función necesitaría `new Date()` y dejaría de ser pura, lo que contradice `CLAUDE.md` §2.4 y §3.1 (tiempo inyectable con `Clock`).
  - Se agregó `calcularPlazoMeses`, que `CLAUDE.md` §2.4 lista en shared y que usa el mapa de `n`.
  - **Enums como objetos `const` con tipo homónimo** en lugar de `enum` de TypeScript: se guardan como texto en SQLite, sirven para `z.enum` y son compatibles con `erasableSyntaxOnly` en la web.
  - **Fechas en UTC y sin encadenar** (cuota k = inicio + k periodos), para que 31/01 → 28/02 → 31/03 no derive a 28/03. Si el día no existe en el mes destino, se usa el último día del mes.
  - **Redondeo:** el interés se redondea por periodo (`ROUND_HALF_UP`) y la última cuota paga el saldo restante. El monto admite como máximo 2 decimales.
  - **Montos como `number`** en unidades monetarias; la conversión a centavos para persistir queda en el backend.
  - **Corrección durante la iteración:** el valor esperado de la última cuota (10 000 al 12 %, 12 meses) se había estimado mal en la prueba (888,54). Se verificó con un cálculo independiente en centavos enteros que el correcto es 888,47, porque redondear la cuota hacia arriba hace que se amortice un poco de más, y se corrigió la prueba, no el código. Los demás valores de referencia (888,49; 443,21; 4163,49; 877,63) se obtuvieron con la fórmula en punto flotante, de forma independiente a la implementación.
  - **Verificación:** build dual comprobado desde la api (`require`, CJS) y la web (`import`, ESM); typecheck, lint, pruebas y Prettier de todo el repo en verde.
- **Commits:** `feat(shared): agregar enums de periodicidad y estado de solicitud`, `feat(shared): calcular cuota nivelada y plan de pagos con decimal.js`, `feat(shared): calcular edad y plazo en meses`, `docs: registrar supuestos de cálculo y exports de shared`, `docs(ai-log): registrar pr de cálculos financieros`
- **PR:** [#3](https://github.com/nestordgt27/SimulacionCredito/pull/3) → `develop`

### [006] 2026-09-25 — Modelo de datos con Prisma

- **Herramienta:** Claude Code
- **Rama:** `feature/datos-modelo-prisma`
- **Prompt (resumen fiel):** Implementar el modelado de datos a partir de una propuesta de `schema.prisma` adjunta, usándola y actualizándola si es necesario según lo implementado en `packages/shared`.
- **Resultado:**
  - **Schema** en `apps/api/src/prisma/schema.prisma` con los modelos `Usuario`, `RefreshToken`, `Cliente`, `Solicitud`, `SolicitudHistorial`, `Credito`, `CuotaPlan`, `Desembolso` y `Secuencia`.
  - **Migración inicial** `20260925144015_modelo_inicial`, aplicada en `dev.db` y `test.db`.
  - **`PrismaService`** (recibe `DATABASE_URL` desde `ConfigService`) y **`PrismaModule`** global, registrado en `AppModule`.
  - **`packages/shared`:** nuevos enums `Banco` y `TipoEmpleo`, con sus pruebas (70 pruebas, 100 % de cobertura).
  - **Pruebas de integración** con SQLite real:
    - configuración `test/jest-integration.json`;
    - scripts `test:int` y `pretest:int`/`pretest:e2e`, que aplican las migraciones sobre `test.db`;
    - helpers `abrirBaseDeDatosDePrueba`/`limpiarBaseDeDatos` y builders `crearUsuario`/`crearCliente`/`crearSolicitud`/`crearCredito`;
    - 9 pruebas del modelo: estado por defecto, plan de `generarPlanPagos` guardado en centavos con saldo final 0, unicidades, `Restrict` y `Cascade`.
  - **Documentación:** README (puesta en marcha con `prisma:migrate`, scripts y supuestos), `docs/ARCHITECTURE.md` (diagrama y convenciones del modelo) y `CLAUDE.md` §4 (secuencia anual y límites de persistencia).
- **Decisiones y ajustes manuales sobre la propuesta:**
  - **`CuotaPlan` alineado con el `CuotaPlan` de `generarPlanPagos`:** `numeroCuota` → `numero` y `saldoRestanteCentavos` → `saldoCentavos`. El mapeo queda campo a campo con el sufijo `Centavos`.
  - **Tasa en puntos básicos:** se mantiene, y se documenta que shared recibe porcentaje (`tasaAnualBps / 100`), por lo que la tasa admite como máximo 2 decimales. La validación se hará en el dominio de solicitudes.
  - **`Banco` y `TipoEmpleo` en shared:** la propuesta los referenciaba como enums de shared y `CLAUDE.md` §2.4 los ubica ahí, pero no existían.
  - **Roles:** no se definieron en shared. La propuesta sugería ADMIN, CAPTURA, ANALISTA y OPERACIONES; se definirán en el módulo `auth`.
  - **Ubicación y comentarios:** se ajustó la ubicación a `src/prisma/` (§2.2) y se quitó el comentario sobre Prisma 7, porque se usa Prisma 6. Se documentó que `fechaAprobacion` es la `fechaInicio` de `generarPlanPagos`, y que edad y plazo son derivados y no se guardan.
  - **Sin CHECK constraints en SQL:** Prisma no los modela, y con SQLite las migraciones que redefinen tablas los perderían sin aviso. La validación de enums y rangos queda en el dominio.
  - **Pruebas de integración:** limpian las tablas en `beforeEach` en lugar de usar `prisma migrate reset`, que es más lento y destructivo. Levantan `AppModule`, así que prueban la misma configuración que la app real.
  - **Ruta de SQLite:** se verificó que el `url` explícito en `PrismaService` sigue resolviendo la ruta relativa desde el schema (no aparecen archivos `.db` fuera de `apps/api/data/`).
  - **Verificación:** typecheck, lint, Prettier, pruebas unitarias (shared 70, api 6, web 1), integración (9), e2e (1) y build en verde.
- **Commits:** `feat(shared): agregar enums de banco y tipo de empleo`, `feat(api): modelar datos con prisma y migración inicial`, `test(api): cubrir el modelo de datos con pruebas de integración en sqlite`, `docs: documentar modelo de datos y supuestos de persistencia`, `docs(ai-log): registrar pr de modelo de datos`
- **PR:** [#4](https://github.com/nestordgt27/SimulacionCredito/pull/4) → `develop`

### [007] 2026-09-25 — Seed con usuario de prueba

- **Herramienta:** Claude Code
- **Rama:** `chore/seed-usuario-admin`
- **Prompt (resumen fiel):** Crear un seed con un usuario de prueba (por ejemplo admin / Admin123!) y documentarlo en el README.
- **Resultado:**
  - Seed `src/prisma/seed.ts`, configurado en `prisma.config.ts` (`migrations.seed`), con el script `prisma:seed`.
  - Lógica en `src/prisma/seed/usuario-admin.seed.ts`: `USUARIO_ADMIN` y `sembrarUsuarioAdmin`, idempotente mediante `upsert` por `username`.
  - Puerto `PasswordHasher` (`modules/auth/domain`) y adaptador `Argon2PasswordHasher` (`modules/auth/infrastructure`, `@node-rs/argon2`).
  - Pruebas:
    - 4 unitarias del hasher: formato argon2id, sal aleatoria, verificación correcta e incorrecta;
    - 3 de integración del seed: crea el admin activo con hash verificable, es idempotente, y restablece contraseña y estado si el usuario fue modificado.
  - README: paso 4 de la puesta en marcha, sección "Usuario de prueba" y script `prisma:seed`. `docs/ARCHITECTURE.md`: seed y `PasswordHasher`.
- **Decisiones y ajustes manuales:**
  - **Argon2id** (recomendación de OWASP) con `@node-rs/argon2`: trae binarios precompilados para Windows y Linux/Alpine, así que no requiere compilación nativa ahora ni al dockerizar. Se descartó `bcrypt`, que requiere compilación nativa.
  - **Puerto `PasswordHasher` ya creado:** el login lo usará después, y así el seed y la autenticación comparten el algoritmo desde el inicio (principio D; es su segundo uso próximo).
  - **Upsert que restablece la contraseña documentada** y reactiva el usuario, para que las credenciales del README funcionen siempre en desarrollo.
  - **Bloqueo en producción:** el seed falla con `NODE_ENV=production` (código de salida 1, verificado).
  - **Rol `ADMIN`** como texto; se tipará cuando el módulo `auth` defina los roles.
  - Se usa `Logger` de Nest en lugar de `console` (`CLAUDE.md` §3.1). `seed.ts` se excluye de la cobertura unitaria porque es solo el punto de entrada.
  - **Verificación:**
    - seed ejecutado dos veces sobre `dev.db`: queda 1 usuario, con hash `$argon2id$` y contraseña verificada;
    - typecheck, lint, Prettier y build en verde;
    - pruebas: unitarias de la api (10), integración (12) y e2e (1).
- **Commits:** `feat(auth): agregar puerto password hasher con adaptador argon2id`, `chore(api): agregar seed idempotente con usuario de prueba admin`, `docs: documentar usuario de prueba y seed en el readme`, `docs(ai-log): registrar pr de seed con usuario de prueba`
- **PR:** [#5](https://github.com/nestordgt27/SimulacionCredito/pull/5) → `develop`
