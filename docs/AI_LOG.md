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
| `chore/seed-usuario-admin` | Seed con usuario de prueba `admin` | `develop` | [#5](https://github.com/nestordgt27/SimulacionCredito/pull/5) | Fusionada |
| `feature/auth-login` | Módulos de dominio y autenticación (login, refresh rotativo, logout, guard global) | `develop` | [#6](https://github.com/nestordgt27/SimulacionCredito/pull/6) | Fusionada |
| `feature/solicitudes-crear-solicitud` | Registro y listado de solicitudes con cuota recalculada y regla de edad | `develop` | [#7](https://github.com/nestordgt27/SimulacionCredito/pull/7) | En revisión |

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

### [008] 2026-09-25 — Módulos de dominio y autenticación

- **Herramienta:** Claude Code
- **Rama:** `feature/auth-login`
- **Prompt (resumen fiel):** Organizar el backend por módulos de dominio (`auth`, `solicitudes`, `comite`, `desembolsos`, `creditos`) más un `PrismaModule` global, e iniciar con `auth`:
  - `POST /auth/login` devuelve un access token de unos 15 minutos y un refresh token;
  - `POST /auth/refresh` rota el refresh token: invalida el anterior y guarda el nuevo hasheado;
  - agregar `POST /auth/logout`;
  - proteger todo lo demás con un `JwtAuthGuard` global y un decorador `@Public()` para el login.
- **Resultado:**
  - **`core`**:
    - puertos `Clock` y `UnitOfWork`, y `SystemClock`;
    - `ErrorDeDominio` con `ErroresDeDominioFilter` global (401/404/409/422);
    - `ValidationPipe` global;
    - `@Public()`, `@UsuarioActual()` y `UsuarioAutenticado`;
    - `CoreModule` global con el health check público.
  - **`PrismaModule`** global: `PrismaUnitOfWork`, que propaga la transacción con `AsyncLocalStorage` mediante `PrismaTransactionContext`.
  - **`modules/auth`** en cuatro capas:
    - `domain`: entidades `Usuario` y `RefreshToken`, errores y puertos;
    - `application`: `IniciarSesionUseCase`, `RefrescarSesionUseCase`, `CerrarSesionUseCase` y `EmisorDeSesion`;
    - `infrastructure`: JWT HS256 con `Clock`, refresh token opaco de 256 bits guardado en SHA-256, y repositorios Prisma;
    - `presentation`: `AuthController`, DTOs y `JwtAuthGuard` como `APP_GUARD`.
  - **Esqueletos** de `SolicitudesModule`, `ComiteModule`, `DesembolsosModule` y `CreditosModule`.
  - **Variables nuevas:** `JWT_ACCESS_SECRET` (mínimo 32 caracteres), `JWT_ACCESS_TTL_SEGUNDOS` (900) y `REFRESH_TOKEN_TTL_DIAS` (7).
  - **Pruebas:**
    - 47 unitarias: casos de uso con puertos mockeados y `FakeClock`, entidades, JWT real con reloj controlado y generador;
    - 22 de integración: rollback real del `UnitOfWork`, incluido el anidado, y repositorios de auth;
    - 18 e2e con los casos de §6.4: login inválido, token expirado, refresh rotado y refresh reutilizado.
    - Cobertura unitaria: dominio 100 % y aplicación 100 % de líneas (92,6 % de ramas).
- **Decisiones y ajustes manuales:**
  - **`POST /auth/refresh` también es `@Public()`**, no solo el login: se llama cuando el access token ya expiró. `logout` exige access token y además el refresh token de la sesión que se cierra; solo revoca si ese token pertenece al usuario autenticado.
  - **Familias de refresh tokens:** la rotación mantiene la familia, y la reutilización de un token ya rotado revoca la familia completa (posible robo). Un token revocado cuenta como reutilización aunque además haya expirado.
  - **La revocación se confirma antes del 401:** `RefrescarSesionUseCase` devuelve un resultado desde la transacción y lanza el error fuera de ella; un throw dentro haría rollback de la revocación.
  - **Concurrencia:** `marcarRotado` usa un `updateMany` condicionado a `revocadoEn IS NULL`; si otra petición ya rotó el mismo token, se trata como reutilización.
  - **Refresh token opaco con SHA-256**, no JWT ni Argon2: tiene 256 bits de entropía, así que un hash rápido es seguro, y permite buscarlo por índice único.
  - **El `Clock` controla `iat`, `exp` y la verificación del JWT**, para que la expiración sea determinista en pruebas (e2e con `overrideProvider(CLOCK)`).
  - **`EmisorDeSesion`** agrupa la emisión del par de tokens, que comparten login y refresh (SRP y sin duplicación).
  - **Refresh token en el cuerpo JSON**, no en una cookie HttpOnly: es más simple para la SPA y su interceptor de Axios. Queda como mejora posible frente a XSS.
  - **`@typescript-eslint/unbound-method` desactivada solo en pruebas:** es un falso positivo con `expect(mock.metodo)`.
  - **Pendientes anotados:**
    - rate limiting del login;
    - igualar el tiempo de respuesta cuando el usuario no existe (hoy no se ejecuta Argon2 en ese caso);
    - verificar en cada petición que el usuario siga activo (hoy el JWT es stateless por 15 minutos);
    - unificar la cobertura de unitarias, integración y e2e para medir el 80 % global.
  - **Bug encontrado y corregido: las pruebas escribían en `dev.db`.**
    - **Causa:** Prisma Client carga `apps/api/.env` al importarse y `ConfigModule` no sobrescribe variables ya definidas, así que `DATABASE_URL` apuntaba a `dev.db` aunque se cargara `.env.test`.
    - **Alcance:** afectaba también las pruebas de las entradas [006] y [007]. La verificación de [006] ("no aparecen archivos `.db` fuera de `data/`") no lo detectaba.
    - **Corrección:** `test/setup-env.ts` carga `.env.test` con `override` en `setupFiles` de las tres configuraciones de Jest, y `limpiarBaseDeDatos` se niega a operar si `DATABASE_URL` no termina en `/test.db`.
    - **Verificación:** después de correr las tres suites, `dev.db` quedó intacta y los datos de prueba están en `test.db`. Consecuencia: el usuario `admin` de `dev.db` fue recreado por las pruebas anteriores (id 91), sin otra pérdida porque solo contenía datos del seed.
  - **Verificación final:**
    - typecheck, lint, Prettier y build en verde;
    - pruebas: shared 70, api unitarias 47, integración 22, e2e 18, web 1;
    - flujo manual con `curl` sobre `dev.db`: login inválido 401, login 200, ruta protegida sin token 401, rotación, reutilización 401 con la sesión revocada y logout 204.
- **Commits:** `fix(api): aislar las pruebas en test.db cargando .env.test antes que prisma`, `feat(core): agregar clock, unit of work transaccional y errores de dominio`, `refactor(api): organizar el backend por módulos de dominio`, `feat(auth): login, refresh rotativo y logout con jwt auth guard global`, `docs: documentar autenticación y arquitectura del backend`, `docs(ai-log): registrar pr de autenticación`
- **PR:** [#6](https://github.com/nestordgt27/SimulacionCredito/pull/6) → `develop`

### [009] 2026-09-25 — Módulo de solicitudes

- **Herramienta:** Claude Code
- **Rama:** `feature/solicitudes-crear-solicitud`
- **Prompt (resumen fiel):** Implementar el módulo de solicitudes:
  - `POST /solicitudes` valida los DTO con class-validator, aplica la regla de edad y recalcula la cuota en el servidor con shared; nunca se confía en la cuota que manda el frontend;
  - `GET /solicitudes?estado=PENDIENTE` sirve para listar.
- **Resultado:**
  - **`packages/shared`:** `EDAD_MAXIMA = 80` y `esEdadPermitida` (74 pruebas, 100 % de cobertura).
  - **`core/domain/dinero.ts`:** conversiones unidades ↔ centavos y porcentaje ↔ puntos básicos.
  - **`modules/solicitudes`:**
    - `domain`: entidad `Solicitud` (`crear` aplica edad y calcula la cuota con shared; `reconstituir` para lecturas), `Cliente`, errores `EdadNoPermitidaError` y `FechaNacimientoInvalidaError` (422), y puerto `SolicitudRepository`;
    - `application`: `CrearSolicitudUseCase` (dentro del `UnitOfWork`), `ListarSolicitudesUseCase` y `SolicitudVista` (unidades, edad y plazo derivados);
    - `infrastructure`: `PrismaSolicitudRepository` (upsert del cliente por cédula, solicitud e historial `null → PENDIENTE`; listado del más reciente al más antiguo);
    - `presentation`: `CrearSolicitudDto` anidado (`cliente`, `empleo`, `credito`) con normalización (trim, cédula en mayúsculas, correo en minúsculas), `ListarSolicitudesQuery` y `SolicitudesController`.
  - **Pruebas:**
    - unitarias de la api: 76 (entidad, casos de uso, dinero);
    - integración: 29 (repositorio, incluido el rollback del cliente si falla la solicitud);
    - e2e: 40 (21 nuevas: cuota falsa ignorada, 80 frente a 81 años, 9 validaciones con 400, filtro por estado, 401 sin token).
    - Cobertura unitaria de `solicitudes`: 100 % en dominio y aplicación.
  - **Documentación:** README (sección Solicitudes y supuestos), `docs/ARCHITECTURE.md` (módulo `solicitudes`) y `CLAUDE.md` §4 (edad, cuota del frontend, cliente, límites).
- **Decisiones y ajustes manuales:**
  - **La cuota no se puede inyectar por diseño:** `Solicitud.crear` es la única forma de crear una solicitud nueva y calcula la cuota con shared. `credito.cuotaNivelada` se acepta en el DTO para no rechazar clientes que la envían, pero el controller la descarta; una e2e envía `cuotaNivelada: 1` y verifica que se guarda 888,49.
  - **Umbral de edad desde shared:** el dominio usa `EDAD_MAXIMA` de shared (una sola fuente con la web). Se valida también que la fecha de nacimiento no sea futura.
  - **Cliente por cédula con upsert:** una solicitud nueva de una cédula existente actualiza los datos del cliente (gana la última captura). Documentado como supuesto.
  - **Límites de captura:**
    - monto hasta 21 474 836,47 (`Int` de 32 bits en centavos);
    - tasa de 0 a 100 %;
    - hasta 360 cuotas;
    - antigüedad hasta 80 años;
    - máximo 2 decimales en montos y tasa.
  - **DTO anidado** en tres bloques (cliente, empleo, crédito), igual que la respuesta.
  - **Listado del más reciente al más antiguo y sin paginación.** Queda pendiente paginar si el volumen lo requiere.
  - **Sin control por rol:** cualquier usuario autenticado puede crear y listar. Los roles se definirán más adelante.
  - **Correcciones durante la iteración:**
    - un valor esperado mío en una prueba estaba mal estimado (87 895); se verificó con la fórmula en punto flotante, independiente de shared, que el correcto es 87 887 (878,8718) y se corrigió la prueba, no el código;
    - se corrigieron 4 hallazgos de lint en pruebas (aserciones de tipo innecesarias y un `objectContaining` anidado tipado como `any`).
  - **Verificación final:**
    - typecheck, lint, Prettier y build en verde;
    - flujo manual con `curl` sobre `dev.db`: el `POST` con `cuotaNivelada: 1` guardó 2289,98, que coincide con la referencia independiente 2289,9766; un cliente de 86 años recibe 422 `EDAD_NO_PERMITIDA`; `GET ?estado=PENDIENTE` filtra correctamente.
- **Commits:** `feat(shared): exponer edad máxima y validación de edad permitida`, `feat(core): agregar conversión de montos a centavos y tasas a puntos básicos`, `feat(solicitudes): crear y listar solicitudes con cuota recalculada en el servidor`, `docs: documentar el módulo de solicitudes y sus supuestos`, `docs(ai-log): registrar pr de solicitudes`
- **PR:** [#7](https://github.com/nestordgt27/SimulacionCredito/pull/7) → `develop`
