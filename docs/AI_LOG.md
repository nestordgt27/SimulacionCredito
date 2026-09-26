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
| `feature/solicitudes-crear-solicitud` | Registro y listado de solicitudes con cuota recalculada y regla de edad | `develop` | [#7](https://github.com/nestordgt27/SimulacionCredito/pull/7) | Fusionada |
| `feature/comite-aprobar-solicitud` | Módulo de comité: vista reducida, aprobación atómica con crédito y plan, rechazo | `develop` | [#8](https://github.com/nestordgt27/SimulacionCredito/pull/8) | Fusionada |
| `feature/desembolsos-desembolsar-credito` | Módulo de desembolsos: APROBADA → DESEMBOLSADA con banco y cuenta en una transacción | `develop` | [#9](https://github.com/nestordgt27/SimulacionCredito/pull/9) | Fusionada |
| `feature/creditos-consultar-credito` | Consulta de créditos por cédula con plan de pagos | `develop` | [#10](https://github.com/nestordgt27/SimulacionCredito/pull/10) | Fusionada |
| `feature/web-auth-login` | Base del frontend (Axios con refresh, sesión, rutas protegidas, UI) y pantalla de login | `develop` | [#11](https://github.com/nestordgt27/SimulacionCredito/pull/11) | Fusionada |
| `feature/web-solicitudes-registrar` | Pantalla de registro de solicitudes con cuota en vivo y bloqueo por edad | `develop` | [#12](https://github.com/nestordgt27/SimulacionCredito/pull/12) | Fusionada |
| `feature/web-comite` | Pantallas del comité: bandeja de pendientes, revisión y dictamen | `develop` | [#13](https://github.com/nestordgt27/SimulacionCredito/pull/13) | Fusionada |
| `feature/web-desembolsos` | Pantallas de desembolso: bandeja de aprobadas, datos bancarios con confirmación | `develop` | [#14](https://github.com/nestordgt27/SimulacionCredito/pull/14) | Fusionada |
| `feature/web-consulta-creditos` | Pantalla de consulta de créditos por cédula con plan de pagos | `develop` | [#15](https://github.com/nestordgt27/SimulacionCredito/pull/15) | Fusionada |
| `feature/web-consulta-paginacion` | Paginación de la consulta de créditos (más de 5) y ruta protegida con parámetros | `develop` | [#16](https://github.com/nestordgt27/SimulacionCredito/pull/16) | En revisión |

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

### [010] 2026-09-25 — Módulo de comité

- **Herramienta:** Claude Code
- **Rama:** `feature/comite-aprobar-solicitud`
- **Prompt (resumen fiel):** Implementar el módulo de comité:
  - `GET /comite/solicitudes/:id` devuelve un DTO reducido solo con los campos del enunciado (cédula, nombre, edad, cuotas, periodicidad, plazo y monto);
  - `POST /comite/solicitudes/:id/aprobar` recibe las observaciones y, dentro de un solo `prisma.$transaction`, verifica que el estado sea PENDIENTE, lo cambia a APROBADA, crea el crédito con su número y crea todas las cuotas del plan; si algo falla, no queda nada a medias;
  - `POST /comite/solicitudes/:id/rechazar` completa el módulo.
- **Resultado:**
  - **`solicitudes/domain`:**
    - `SolicitudStateMachine`;
    - `Solicitud.aprobar` (observaciones obligatorias) y `Solicitud.rechazar` (observaciones opcionales), inmutables;
    - campos `evaluadaPorId` y `fechaEvaluacion`;
    - errores `SolicitudNoEncontradaError` (404), `TransicionInvalidaError` (409) y `ObservacionesRequeridasError` (422).
  - **`SolicitudRepository`:** `buscarPorId` y `registrarEvaluacion`, que es condicional al estado anterior y agrega la entrada de historial.
  - **`creditos`:**
    - `Credito.otorgar` genera el plan con `generarPlanPagos` y lo guarda en centavos;
    - `formatearNumeroCredito`;
    - `PrismaCreditoRepository` (crédito + `createMany` de cuotas);
    - `PrismaNumeroCreditoGenerator` (secuencia anual con incremento atómico).
  - **`comite`:**
    - `ObtenerSolicitudComiteUseCase`, con una vista de exactamente 7 campos;
    - `AprobarSolicitudUseCase` y `RechazarSolicitudUseCase`, dentro del `UnitOfWork`;
    - `ComiteController` y DTOs.
  - **Pruebas:**
    - unitarias de la api: 132, que incluyen las 16 combinaciones de la máquina de estados, aprobar sin observaciones y la creación de N cuotas;
    - integración: 36, con el rollback completo ante un fallo real de la base al crear las cuotas;
    - e2e: 56 (16 nuevas del comité).
    - Cobertura unitaria de dominio y aplicación de `comite`, `creditos` y `solicitudes`: 100 %.
  - **Documentación:** README (sección Comité y supuestos), `docs/ARCHITECTURE.md` (módulos `comite` y `creditos`) y `CLAUDE.md` §4.
- **Decisiones y ajustes manuales:**
  - **Máquina de estados como única fuente de transiciones.** `aprobar` y `rechazar` la usan. La verificación "está PENDIENTE" ocurre dos veces: en el dominio, que da un error claro, y en la base con un `updateMany ... WHERE estado = 'PENDIENTE'`, que cubre la concurrencia. Si otra petición cambió el estado, responde 409 y no se crea el crédito.
  - **La transacción de aprobación incluye el número de crédito.** Si falla la creación de cuotas, también se revierte el incremento de la secuencia, así no quedan huecos en la numeración.
  - **Rollback probado con un fallo real de SQLite, no con un mock:** una subclase del repositorio repite una cuota y la base rechaza el `createMany` (`P2002`) después de insertar el crédito.
  - **Vista del comité con exactamente los 7 campos pedidos** (probado con `toStrictEqual`). No incluye `id` ni `estado`, porque el enunciado no los pide.
  - **Observaciones vacías (solo espacios):** el DTO acepta cualquier texto y es el dominio el que responde 422 `OBSERVACIONES_REQUERIDAS`. Si falta el campo, responde 400.
  - **Rechazo sin observaciones obligatorias:** `CLAUDE.md` solo las exige al aprobar.
  - **Aprobar y rechazar responden 200** con el resultado, en lugar de 201: son acciones sobre un recurso existente.
  - **`Credito.reconstituir` se eliminó** porque solo lo usaba una prueba; volverá con la consulta de créditos.
  - **Correcciones durante la iteración:**
    - un valor esperado mío en la e2e estaba mal estimado (470,73); la referencia independiente (fórmula en punto flotante) da 443,2061 y se corrigió la prueba;
    - dos hallazgos de lint corregidos.
  - **Dato corrupto en `dev.db` causado por la prueba manual de [009]:** el `curl` desde Git Bash en Windows envió "Martínez" en la codificación de la consola, no UTF-8, y el parser JSON lo guardó con U+FFFD. No es un bug de la API (las e2e envían UTF-8 y funcionan). Se corrigió el registro de prueba en `dev.db`.
  - **Verificación final:**
    - typecheck, lint, Prettier y build en verde;
    - flujo manual sobre `dev.db`: vista reducida, 422 sin observaciones, aprobación con `CR-2026-000001` y 24 cuotas que suman el monto con saldo final 0 y primer vencimiento 15 días después, y 409 al aprobar de nuevo.
- **Commits:** `feat(solicitudes): agregar máquina de estados y dictamen de aprobación o rechazo`, `feat(creditos): otorgar crédito con número incremental y plan de pagos`, `feat(comite): vista reducida, aprobación atómica y rechazo de solicitudes`, `docs: documentar el módulo de comité y la aprobación atómica`, `docs(ai-log): registrar pr de comité`
- **PR:** [#8](https://github.com/nestordgt27/SimulacionCredito/pull/8) → `develop`

### [011] 2026-09-25 — Módulo de desembolsos

- **Herramienta:** Claude Code
- **Rama:** `feature/desembolsos-desembolsar-credito`
- **Prompt (resumen fiel):** Implementar el módulo de desembolsos: `POST /desembolsos/:solicitudId` recibe el banco (enum de los 4 bancos) y el número de cuenta, valida que el estado sea APROBADA y lo actualiza a DESEMBOLSADA en una transacción.
- **Resultado:**
  - **Refactor previo, sin cambio de comportamiento:**
    - `SolicitudRepository.registrarEvaluacion` pasa a llamarse `registrarTransicion(solicitud, { estadoAnterior, usuarioId, fecha, comentario })`, para que el historial registre quién ejecuta cada cambio (evaluador o quien desembolsa);
    - los helpers `buscarSolicitud` y `registrarTransicion` se movieron de `comite` a `solicitudes/application/transiciones.ts`, porque los usan comité y desembolsos.
  - **`solicitudes/domain`:** `Solicitud.desembolsar()` vía la máquina de estados (solo desde APROBADA).
  - **`creditos`:** `CreditoRepository.buscarPorSolicitud` (devuelve un `CreditoResumen`) y `CreditoNoEncontradoError` (404).
  - **`desembolsos`:**
    - `Desembolso.registrar`, siempre por el monto total del crédito;
    - `DesembolsarCreditoUseCase`: en el `UnitOfWork`, desembolsar la solicitud, buscar el crédito, registrar la transición condicional y crear el desembolso;
    - `PrismaDesembolsoRepository`;
    - `DesembolsarDto` (`banco` del enum `Banco`; `numeroCuenta` de 6 a 20 dígitos como texto);
    - `DesembolsosController`, que responde 201.
  - **Pruebas:**
    - unitarias de la api: 146;
    - integración: 39, con el rollback real si falla el `INSERT` del desembolso;
    - e2e: 74 (18 nuevas: 409 desde PENDIENTE, RECHAZADA y al repetir; los 4 bancos; 6 validaciones con 400; 404; 401).
    - Cobertura unitaria de dominio y aplicación de `desembolsos`: 100 %.
  - **Documentación:** README (sección Desembolsos y supuestos), `docs/ARCHITECTURE.md` (módulo `desembolsos` y transiciones compartidas) y `CLAUDE.md` §4.
- **Decisiones y ajustes manuales:**
  - **Validación en dos niveles**, igual que en el comité:
    - la máquina de estados valida el estado (409 claro);
    - el `updateMany` condicional al estado anterior cubre la concurrencia;
    - además, `creditoId` es único en `desembolsos`, así que un crédito no se puede desembolsar dos veces ni por error.
  - **Desembolso por el monto total** del crédito, sin montos parciales.
  - **Número de cuenta:** solo dígitos (de 6 a 20) y como texto, para conservar los ceros a la izquierda. Un número JSON en lugar de texto responde 400. Queda como supuesto: el enunciado no fija un formato por banco.
  - **Comentario de historial `Desembolso en <BANCO>`,** sin el número de cuenta, para no copiar datos bancarios en la auditoría.
  - **El helper de puertos de prueba se renombró** a `crearPuertosSolicitudYCredito` (`test/support/puertos-solicitud-credito.ts`), porque ahora lo usan el comité y los desembolsos.
  - **Prueba manual con `fetch` de Node en lugar de `curl`,** para evitar el problema de codificación de la consola de Windows detectado en [010].
  - **Verificación final:**
    - typecheck, lint, Prettier y build en verde;
    - flujo manual sobre `dev.db`: un banco inválido da 400; desembolsar la solicitud 36 da 201 con la cuenta `0012345678` intacta; repetirlo da 409; la solicitud aparece en `?estado=DESEMBOLSADA`.
- **Commits:** `refactor(solicitudes): generalizar el registro de transiciones con usuario, fecha y comentario`, `feat(solicitudes): permitir desembolsar una solicitud aprobada`, `feat(desembolsos): desembolsar créditos aprobados en una transacción`, `docs: documentar el módulo de desembolsos`, `docs(ai-log): registrar pr de desembolsos`
- **PR:** [#9](https://github.com/nestordgt27/SimulacionCredito/pull/9) → `develop`

### [012] 2026-09-25 — Consulta de créditos por cédula

- **Herramienta:** Claude Code
- **Rama:** `feature/creditos-consultar-credito`
- **Prompt (resumen fiel):** Implementar la consulta de créditos (extra): `GET /creditos?cedula=...` devuelve los créditos y su plan de pagos.
- **Resultado:**
  - **`creditos/domain`:** puerto de lectura `ConsultaCreditos.porCedula` con el tipo `CreditoDetalle` (en centavos).
  - **`creditos/application`:** `ConsultarCreditosUseCase`, que devuelve `CreditoVista` en unidades con `plazoMeses` derivado y `planPagos` con los nombres de shared.
  - **`creditos/infrastructure`:** `PrismaConsultaCreditos`, una sola consulta con estado de la solicitud, cliente, desembolso y cuotas ordenadas, filtrada por la cédula del cliente de la solicitud.
  - **`creditos/presentation`:** `ConsultarCreditosQuery` (cédula normalizada y validada) y `CreditosController`.
  - **Pruebas:**
    - unitarias de la api: 151;
    - integración: 45 (6 nuevas: filtro por cédula, plan ordenado que suma el monto, estado y desembolso, `null` sin desembolso, orden de varios créditos, solicitudes sin crédito excluidas);
    - e2e: 84 (10 nuevas: respuesta completa, plan de 12 cuotas con su primera y última fila, desembolso, sin número de cuenta, aislamiento por cédula, minúsculas, lista vacía, 400 y 401).
    - Cobertura unitaria de `creditos` (dominio y aplicación): 100 %.
  - **Documentación:** README (sección Consulta de créditos), `docs/ARCHITECTURE.md` (modelo de lectura) y `CLAUDE.md` §4.
- **Decisiones y ajustes manuales:**
  - **Modelo de lectura** en lugar de reconstruir entidades: `ConsultaCreditos` es un puerto solo de lectura, separado de `CreditoRepository`, que es de escritura (segregación de interfaces). El puerto vive en `domain` para respetar la regla de dependencias (la infraestructura implementa puertos del dominio).
  - **Respuesta como arreglo** (`[]` si no hay créditos o el cliente no existe), en lugar de 404: es un filtro sobre la colección de créditos.
  - **`planPagos` con los mismos nombres que `generarPlanPagos` de shared**, para que la web lo muestre sin traducir campos.
  - **Sin número de cuenta en la respuesta,** con una e2e que lo verifica: solo banco y fecha del desembolso.
  - **La cédula se normaliza igual que al registrar la solicitud** (sin espacios y en mayúsculas).
  - **Verificación de valores:** la primera cuota quincenal (interés 50, capital 393,21, saldo 9606,79) se comparó con un cálculo independiente.
  - **Hallazgo de lint corregido** en la e2e: desestructuración de `body`, que está tipado como `any`.
  - **Verificación final:**
    - typecheck, lint, Prettier y build en verde;
    - consulta real sobre `dev.db` con `fetch` de Node: `?cedula=001-150385-0007k` en minúsculas devuelve el crédito `CR-2026-000001` DESEMBOLSADO con 24 cuotas cuyo capital suma 50 000 y saldo final 0; cédula inválida da 400; sin token da 401.
- **Commits:** `feat(creditos): consultar créditos por cédula con su plan de pagos`, `docs: documentar la consulta de créditos`, `docs(ai-log): registrar pr de consulta de créditos`
- **PR:** [#10](https://github.com/nestordgt27/SimulacionCredito/pull/10) → `develop`

### [013] 2026-09-25 — Frontend: base y pantalla de login

- **Herramienta:** Claude Code
- **Rama:** `feature/web-auth-login`
- **Prompt (resumen fiel):** Implementar el frontend con React Router, TanStack Query para el estado del servidor, React Hook Form + Zod para los formularios y un cliente Axios con interceptor, que adjunte el token y, ante un 401, llame a `/auth/refresh` una sola vez y reintente la petición. Pantalla 1: Login. La UI puede ser simple (Tailwind o una librería de componentes), limpia y consistente.
- **Resultado:**
  - **Dependencias:** axios, react-hook-form, @hookform/resolvers, zod y Tailwind CSS v4 (`@tailwindcss/vite`); para pruebas, msw y @testing-library/user-event.
  - **`shared/auth`:** `sesionStore` (fuera de React: access token en memoria; refresh token y usuario en `localStorage`) y `useSesion` (`useSyncExternalStore`).
  - **`shared/api`:**
    - `clienteHttp` con interceptor de request (Bearer) y de response (ante 401: refresh single-flight, reintento único, sin refresh en `/auth/login` ni `/auth/refresh`, cierre de sesión si el refresh falla);
    - `mensajeDeError`.
  - **`shared/ui`:** `Boton`, `Campo` (label, `aria-invalid` y `aria-describedby`), `Alerta` y `Tarjeta`.
  - **`features/auth`:** `auth.api`, `loginSchema` (Zod), `useIniciarSesion`, `useCerrarSesion`, `LoginForm` (RHF + `zodResolver`) y `LoginPage`.
  - **`app`:**
    - `crearQueryClient` (sin reintentos en 4xx; hasta 2 en 5xx y errores de red; mutaciones sin reintento);
    - `RutaProtegida`, que redirige al login recordando la ruta;
    - `AppLayout`, con el usuario y "Cerrar sesión";
    - `InicioPage` provisional;
    - rutas `/login`, `/` y el comodín `*`.
  - **Pruebas web:** 44 con Vitest + Testing Library + MSW.
    - Interceptor (11): Bearer, refresh y reintento, tokens rotados, 3 peticiones concurrentes con un solo refresh, un único reintento, refresh fallido que cierra la sesión, sin refresh en login ni sin sesión, recarga sin access token, errores que no son 401.
    - Store de sesión (6), `mensajeDeError` (5), política del `QueryClient` (8).
    - Login (7): validación, éxito, 401 del backend, error de red, botón deshabilitado, redirección con sesión.
    - Navegación (7): ruta protegida, vuelta a la ruta pedida, logout con y sin respuesta del servidor, sesión cerrada por refresh fallido, ruta desconocida.
    - Cobertura de la web: 98 % de líneas.
  - **Documentación:** README (sección Frontend y supuesto de sesión), `docs/ARCHITECTURE.md` (estructura, sesión e interceptores, pruebas del frontend) y `CLAUDE.md` §4.
- **Decisiones y ajustes manuales:**
  - **Almacenamiento de tokens:** el access token solo en memoria; el refresh token y el usuario en `localStorage`, para sobrevivir al recargo. Es un compromiso frente a XSS: una cookie HttpOnly sería más segura, pero requiere cambiar el backend (hoy el refresh viaja en el cuerpo JSON). Queda documentado como supuesto.
  - **Refresh single-flight:** es imprescindible con este backend. Dos refresh paralelos con el mismo token harían que el segundo se tratara como reutilización y se revocara toda la sesión.
  - **Store fuera de React:** el interceptor de Axios no puede usar hooks; los componentes lo leen con `useSyncExternalStore`, así un refresh fallido redirige al login sin lógica adicional.
  - **La página de login redirige sola cuando aparece la sesión** (sin `navigate` en `onSuccess`), y vuelve a la ruta pedida originalmente (`state.desde`).
  - **Logout:** la sesión local se cierra aunque falle la revocación en el servidor.
  - **`conSesion` en su propio helper** (`test/sesion.ts`), separado de `renderApp`: las pruebas del interceptor no dependen de las rutas de la app, y cada commit se puede verificar por separado.
  - **`App.tsx` excluido de la cobertura** (igual que `main.tsx`): solo conecta el router del navegador; las rutas reales se prueban con `createMemoryRouter`.
  - **Prueba de mutación del interceptor:**
    - al quitar el single-flight (`??=` → `=`) falla exactamente la prueba de peticiones concurrentes;
    - al quitar la marca `_reintentada`, la prueba original entraba en un ciclo infinito de refresh y reintento (se colgó y hubo que detener los procesos de vitest). Se ajustó para que el refresh solo funcione una vez: ahora esa mutación falla en 51 ms en la prueba correcta.
    - El interceptor se restauró y se verificó con `git diff` que no quedaron cambios.
  - **Verificación manual en el navegador** (panel del navegador, API sobre `dev.db` y Vite):
    - `/` redirige a `/login`;
    - el formulario vacío muestra la validación de Zod;
    - una contraseña incorrecta muestra "Usuario o contraseña incorrectos";
    - el login correcto lleva al inicio con el nombre del usuario;
    - `localStorage` contiene solo `refreshToken` y `usuario`;
    - al recargar, la sesión se mantiene; dos peticiones reales sin access token dieron dos 401, **un solo** `POST /auth/refresh` y dos reintentos con 200, con el refresh token rotado;
    - "Cerrar sesión" hizo `POST /auth/logout` (204), borró `localStorage` y volvió al login.
  - **Verificación final:** typecheck, lint, Prettier y build en verde; pruebas de shared (74), api (151) y web (44).
- **Commits:** `feat(web): agregar cliente http con refresh automático y almacén de sesión`, `feat(web): agregar componentes base de ui con tailwind`, `feat(auth): pantalla de login con rutas protegidas y cierre de sesión`, `docs: documentar el frontend y la sesión`, `docs(ai-log): registrar pr del frontend y login`
- **PR:** [#11](https://github.com/nestordgt27/SimulacionCredito/pull/11) → `develop`

### [014] 2026-09-25 — Frontend: registro de solicitudes

- **Herramienta:** Claude Code
- **Rama:** `feature/web-solicitudes-registrar`
- **Prompt (resumen fiel):** Implementar la pantalla de solicitudes con tres secciones (personal, laboral y crédito), con la cuota nivelada recalculada en vivo desde shared y un bloqueo claro si la edad supera 80.
- **Resultado:**
  - **`packages/shared`:**
    - `LIMITES_SOLICITUD` (monto máximo, tasa máxima, cuotas máximas, antigüedad máxima, decimales);
    - `FORMATO_CEDULA` y `tieneMaximoDecimales`, que también reutiliza la validación interna de shared;
    - 87 pruebas, 100 % de cobertura.
  - **API:** `CrearSolicitudDto` y `ConsultarCreditosQuery` toman los límites y el formato de cédula de shared en lugar de constantes propias. Sin cambio de comportamiento: 151 unitarias y 84 e2e en verde.
  - **Web — `shared`:** `Selector`, `Seccion` (fieldset + legend) y `formatearMonto` / `formatearMeses`.
  - **Web — `features/solicitudes`:**
    - `crearSolicitudSchema(hoy)` y `creditoSchema` (Zod);
    - `edadSegunFecha`;
    - hooks `useCuotaEstimada` y `useCrearSolicitud`;
    - componentes `SolicitudForm` (tres secciones, cuota en vivo, aviso de edad y botón deshabilitado), `ResumenCuota` y `ResultadoSolicitud`;
    - página `NuevaSolicitudPage` en `/solicitudes/nueva`.
  - **Web — `app`:** navegación principal (Inicio y Nueva solicitud) y enlace desde el inicio.
  - **Pruebas web:** 87 (43 nuevas).
    - Esquema (23): válido, normalización, 80 frente a 81 años, 14 reglas, `edadSegunFecha`.
    - Formato (6).
    - Página (14): tres secciones, enlace desde el inicio, cuota en vivo (guion, 888,49, recálculo a quincenal 443,21, vuelta al guion con un dato inválido), bloqueo de 81 años sin petición, 80 años permitido, quitar el bloqueo al corregir, cuerpo enviado sin cuota, resultado con la cuota del servidor, "Registrar otra", validaciones y error 422 del backend.
    - Cobertura de la web: 99 % de líneas.
  - **Documentación:** README (pantalla Nueva solicitud), `docs/ARCHITECTURE.md` (registro de solicitudes, pruebas con fecha fija) y `CLAUDE.md` §4 (límites compartidos).
- **Decisiones y ajustes manuales:**
  - **Límites en shared:** `CLAUDE.md` §2.5 pide validar "reutilizando reglas de shared (edad máxima, rangos)". Los límites estaban solo en el DTO de la API; ahora ambos lados usan la misma fuente.
  - **Cuota en vivo sin enviarla:** el cálculo usa las mismas funciones de shared que el backend. El POST no incluye la cuota, y el resultado muestra la que confirmó el servidor.
  - **Bloqueo por edad en tres niveles:**
    - aviso visible con la edad y el máximo;
    - botón deshabilitado;
    - validación de Zod.

    El backend sigue siendo la regla real (422).
  - **Hoy fijo al abrir la página,** para que la edad no cambie mientras se llena el formulario.
  - **Correcciones durante la iteración:**
    - **Defecto del esquema detectado por una prueba:** con la fecha vacía, Zod ejecutaba igual el `superRefine` y mostraba dos mensajes en el mismo campo. Se corrigió en el código.
    - **Pruebas lentas e intermitentes:** llenar el formulario tecla por tecla tardaba unos 3 s por prueba, y con cobertura se superaban los 5 s. Se cambió a `paste` (las fechas se siguen escribiendo, porque `input type="date"` no admite pegado) y se fijó `testTimeout` de 15 s con `vi.setConfig` al cargar el módulo, solo en ese archivo. Primero se probó en `beforeAll` y no funcionó, porque Vitest asigna el límite al recolectar las pruebas. Estable en dos corridas seguidas con cobertura.
    - **Escapes de la shell:** el reemplazo de la expresión regular de la cédula en los DTO falló porque la shell se comió una barra invertida; se aplicó con un script en archivo (`String.raw`).
  - **Verificación manual en el navegador** (API sobre `dev.db` y Vite):
    - navegación a "Nueva solicitud";
    - cuota en vivo de C$ 2,289.98 en 12 meses para 50 000 al 18,5 % en 24 cuotas quincenales, el mismo valor que calcula el servidor;
    - con la fecha 1940-01-01 aparece "El cliente tiene 86 años y la edad máxima permitida es 80 años" y el botón queda deshabilitado;
    - al corregir la fecha el aviso desaparece ("Edad: 41 años");
    - registro con 201: solicitud **#37 creada en `dev.db`** (María López, `001-150385-0008K`).
  - **Servidores del usuario detenidos:** para levantar la API recompilada se detuvieron los procesos de API y Vite que el usuario tenía en los puertos 3000 y 5173.
- **Commits:** `feat(shared): compartir límites de captura y formato de cédula`, `feat(web): agregar selector, secciones y formato de montos`, `feat(solicitudes): pantalla de registro con cuota en vivo y bloqueo por edad`, `docs: documentar la pantalla de registro de solicitudes`, `docs(ai-log): registrar pr del registro de solicitudes`
- **PR:** [#12](https://github.com/nestordgt27/SimulacionCredito/pull/12) → `develop`

### [015] 2026-09-25 — Frontend: comité

- **Herramienta:** Claude Code
- **Rama:** `feature/web-comite`
- **Prompt (resumen fiel):** Implementar la pantalla del comité.
- **Resultado:**
  - **`shared/lib/etiquetas.ts`:** `ETIQUETAS_PERIODICIDAD`, `ETIQUETAS_TIPO_EMPLEO` y `opcionesDe`. El formulario de solicitudes y `ResultadoSolicitud` las reutilizan (antes tenían listas propias).
  - **`shared/lib/formato.ts`:** `formatearFecha` (dd/mm/aaaa en UTC).
  - **`shared/ui`:** `AreaTexto`, con etiqueta, ayuda y error accesibles.
  - **`features/comite`:**
    - `comite.api` (listar pendientes, obtener la vista reducida, aprobar, rechazar);
    - hooks en `useComite` (`useSolicitudesPendientes`, `useSolicitudComite`, `useAprobarSolicitud`, `useRechazarSolicitud`, que invalidan `['solicitudes']`);
    - esquemas `aprobacionSchema` y `rechazoSchema`;
    - componentes `TablaPendientes`, `FichaSolicitud` (7 campos), `DictamenForm` y `ResultadoDictamen`;
    - páginas `BandejaComitePage` (`/comite`) y `RevisionSolicitudPage` (`/comite/:id`).
  - **`app`:** rutas del comité, el enlace "Comité" en la navegación, y `end` solo en "Inicio", para que "Comité" quede activo también en `/comite/:id`.
  - **Pruebas web:** 105 (18 nuevas).
    - Bandeja (6): pide solo PENDIENTE, filas con los datos formateados, navegación a la revisión, lista vacía, error y enlace del menú.
    - Revisión (10): exactamente los 7 campos, 404, id inválido; aprobar sin observaciones o con solo espacios, sin petición; aprobar con el número de crédito y observaciones recortadas; 409 del backend; bandeja actualizada después de aprobar; rechazar sin observaciones (envía `{}`) y con observaciones.
    - `formatearFecha` (1) y `opcionesDe` (1).
    - Cobertura de la web: 98,8 % de líneas.
  - **Documentación:** README (pantallas Comité y Revisión) y `docs/ARCHITECTURE.md` (sección Comité, con la limitación conocida).
- **Decisiones y ajustes manuales:**
  - **Bandeja y revisión en rutas separadas** (`/comite` y `/comite/:id`): cada solicitud tiene su URL y las pruebas navegan como una persona.
  - **Dos esquemas para un solo campo:** aprobar exige observaciones y rechazar no, así que cada botón valida con su esquema en vez de usar un resolver único de React Hook Form.
  - **Invalidación por prefijo `['solicitudes']`:** después de un dictamen (y después de registrar una solicitud) la bandeja se recarga sola.
  - **Tipos propios en `comite.api`,** con solo los campos que usa, en lugar de importar tipos de otra feature: las features quedan independientes.
  - **Limitación conocida:** la vista del comité no incluye el estado, porque el enunciado pide exactamente 7 campos. Al abrir una solicitud ya evaluada, el formulario aparece, pero el backend responde 409 y se muestra su mensaje. Una mejora posible es agregar el estado a esa vista, si se acepta ampliar el enunciado.
  - **Prueba de mutación:** hacer que "Aprobar" valide con el esquema de rechazo rompe exactamente las 2 pruebas de observaciones obligatorias. El componente se restauró.
  - **Verificación manual en el navegador,** con los servidores de `npm run dev` que el usuario tenía levantados (esta vez no se detuvieron):
    - la bandeja mostró las 3 pendientes;
    - en la **#39 de prueba creada para esto**, "Aprobar" sin observaciones mostró el error sin petición; con observaciones se otorgó **CR-2026-000002**; la bandeja se actualizó; un segundo intento mostró el 409 del backend;
    - la **#40 de prueba** se rechazó con observaciones.
    - Las pendientes del usuario (#37 y #38) no se tocaron.
  - **Verificación final:** typecheck, lint, Prettier y build en verde; pruebas de shared (87), api (151) y web (105).
- **Commits:** `refactor(web): compartir etiquetas de enums y formato de fechas`, `feat(comite): bandeja de pendientes, revisión y dictamen del comité`, `docs: documentar las pantallas del comité`, `docs(ai-log): registrar pr de las pantallas del comité`
- **PR:** [#13](https://github.com/nestordgt27/SimulacionCredito/pull/13) → `develop`

### [016] 2026-09-25 — Frontend: desembolsos

- **Herramienta:** Claude Code
- **Rama:** `feature/web-desembolsos`
- **Prompt (resumen fiel):** Implementar la pantalla de desembolsos.
- **Resultado:**
  - **`packages/shared`:** `FORMATO_NUMERO_CUENTA` (6 a 20 dígitos), con pruebas (95 en total, 100 % de cobertura). El `DesembolsarDto` de la API lo usa en lugar de su expresión propia; las 18 e2e de desembolsos siguen en verde.
  - **`shared/lib/etiquetas.ts`:** `ETIQUETAS_BANCO` (LAFISE, FICOHSA, BAC Credomatic, Banpro).
  - **`features/desembolsos`:**
    - `desembolsos.api` (listar aprobadas, desembolsar);
    - hooks `useSolicitudesAprobadas` y `useDesembolsar` (invalidan `['solicitudes']` y `['creditos']`);
    - `desembolsoSchema` (banco del enum y cuenta con el formato compartido);
    - componentes `TablaAprobadas`, `ResumenCredito`, `DesembolsoForm` (datos bancarios y confirmación) y `ResultadoDesembolso`;
    - páginas `BandejaDesembolsosPage` (`/desembolsos`) y `DesembolsarPage` (`/desembolsos/:solicitudId`).
  - **`app`:** rutas y enlace "Desembolsos" en la navegación.
  - **Pruebas web:** 121 (16 nuevas), con MSW.
    - Bandeja (5): pide solo APROBADA, fila con monto y cuota, navegación, error y enlace del menú.
    - Desembolso (11): resumen, exactamente 4 bancos, validación sin petición, cuenta con letras, confirmación con el resumen y sin petición, corregir datos, envío con cuenta recortada y ceros conservados, bandeja actualizada, 409 en la confirmación, solicitud no aprobada e id inválido.
    - Cobertura de la web: 99 % de líneas.
  - **Documentación:** README (pantallas Desembolsos y Desembolso), `docs/ARCHITECTURE.md` (sección Desembolsos) y `CLAUDE.md` §4 (formato de cuenta compartido).
- **Decisiones y ajustes manuales:**
  - **Paso de confirmación** antes de enviar: el desembolso mueve dinero y no se puede deshacer. Se muestra el monto, el cliente, el banco y la cuenta completa, para que quien opera la verifique.
  - **Resumen tomado de la lista de aprobadas** en lugar de un endpoint nuevo. Además, si la solicitud no está aprobada o ya se desembolsó, se muestra un aviso en lugar del formulario; así se evita la limitación que tiene la pantalla del comité.
  - **Formato de cuenta en shared,** igual que la cédula en [014]: el front y el back no pueden divergir.
  - **Prueba de mutación:** hacer que el formulario envíe sin pasar por la confirmación rompe 5 pruebas. El componente se restauró.
  - **Verificación manual en el navegador,** con los servidores de `npm run dev` del usuario (la API se recompiló sola en modo watch tras el cambio del DTO):
    - la bandeja mostró las aprobadas;
    - en la **#39 de prueba**, una cuenta `12AB5678` sin banco mostró los dos errores;
    - con BAC Credomatic y `0012345678`, la confirmación mostró el resumen sin hacer ninguna petición;
    - al confirmar, el POST respondió 201 y **CR-2026-000002** quedó DESEMBOLSADA, con la cuenta intacta;
    - la bandeja se actualizó, y al reabrir la #39 se mostró el aviso.
    - La aprobada #38 del usuario no se tocó.
  - **Verificación final:** typecheck, lint, Prettier y build en verde; pruebas de shared (95), api (151) y web (121).
- **Commits:** `feat(shared): compartir el formato del número de cuenta`, `feat(desembolsos): bandeja de aprobadas y desembolso con confirmación`, `docs: documentar las pantallas de desembolso`, `docs(ai-log): registrar pr de las pantallas de desembolso`
- **PR:** [#14](https://github.com/nestordgt27/SimulacionCredito/pull/14) → `develop`

### [017] 2026-09-25 — Frontend: consulta de créditos

- **Herramienta:** Claude Code
- **Rama:** `feature/web-consulta-creditos`
- **Prompt (resumen fiel):** Implementar la consulta de créditos.
- **Resultado:**
  - **`shared/lib/montos.ts`:** `sumarMontos`, que suma en centavos enteros.
  - **`features/consulta`:**
    - `creditos.api` (`GET /creditos?cedula=`);
    - `useCreditosPorCedula` (clave `['creditos', cedula]`, solo con una cédula válida);
    - `busquedaSchema` y `cedulaValida` (formato de cédula de shared);
    - componentes `BuscadorCedula` (`role="search"`), `EstadoCredito`, `TarjetaCredito` (condiciones, desembolso y plan desplegable) y `TablaPlanPagos` (con fila de totales);
    - página `ConsultaCreditosPage` (`/creditos`), con la cédula en la URL.
  - **`app`:** ruta `/creditos` y enlace "Consulta" en la navegación.
  - **Pruebas web:** 138 (17 nuevas), con MSW.
    - `sumarMontos` (3): 0,1 + 0,2 y el capital de un plan real de shared, que suma exactamente el monto.
    - Página (14): validación sin petición, búsqueda normalizada guardada en la URL, URL precargada, URL con cédula inválida ignorada sin petición, condiciones y estado, desembolsado con banco y fecha, varios créditos, plan oculto hasta pedirlo, 12 filas con la primera y la última exactas, totales, volver a ocultarlo, sin resultados, error y enlace del menú.
    - El plan de prueba se genera con `generarPlanPagos` de shared (datos reales, sin valores inventados).
    - Cobertura de la web: 99 % de líneas.
  - **Documentación:** README (pantalla Consulta) y `docs/ARCHITECTURE.md` (sección Consulta de créditos).
- **Decisiones y ajustes manuales:**
  - **Cédula en la URL** en lugar de estado local: la búsqueda se puede compartir, sobrevive al recargo y funciona con atrás y adelante (el formulario se reinicia con `key` al cambiar la URL). Una cédula manipulada en la URL se valida y se ignora.
  - **Totales en centavos enteros** (`sumarMontos`), con el mismo criterio que la persistencia del backend: la suma del capital coincide exactamente con el monto.
  - **Plan desplegable a pedido,** con `aria-expanded` y `aria-controls`: un cliente puede tener varios créditos con cientos de cuotas.
  - **Número de cuenta no mostrado:** la API de consulta no lo expone, así que la pantalla solo muestra banco y fecha del desembolso.
  - **Prueba de mutación:** si `cedulaValida` deja pasar cualquier valor, falla la prueba "cédula inválida en la URL sin petición". El archivo se restauró.
  - **Verificación manual en el navegador** (servidores levantados para la prueba y detenidos al terminar, porque los del usuario no estaban corriendo):
    - el panel del navegador no aceptaba clics por no estar visible, así que se verificó con la URL y con clics disparados desde el DOM;
    - `/creditos?cedula=001-200390-0042c` normalizó la cédula en la petición y mostró **CR-2026-000002** (desembolsado, BAC Credomatic);
    - el registro de red mostró el refresh del interceptor tras el recargo (401 y reintento con 200);
    - el plan real tiene 12 filas: primera cuota con interés 187,50, última de 1353,93 con saldo 0, y totales C$ 16,246.50 / C$ 15,000.00 / C$ 1,246.50, que coinciden con el cálculo independiente.
  - **Verificación final:** typecheck, lint, Prettier y build en verde; pruebas de shared (95), api (151) y web (138).
- **Commits:** `feat(web): sumar montos en centavos enteros`, `feat(consulta): consulta de créditos por cédula con plan de pagos`, `docs: documentar la pantalla de consulta de créditos`, `docs(ai-log): registrar pr de la consulta de créditos`
- **PR:** [#15](https://github.com/nestordgt27/SimulacionCredito/pull/15) → `develop`

### [018] 2026-09-26 — Paginación de la consulta de créditos

- **Herramienta:** Claude Code
- **Rama:** `feature/web-consulta-paginacion`
- **Prompt (resumen fiel):** En la sección de consultas, agregar paginación al listado de créditos cuando la cantidad supere 5.
- **Resultado:**
  - **`shared/lib/paginacion.ts`:** `paginar()` (porción de la página, ajuste al rango válido, `desde`/`hasta`) y `leerPagina()` (parámetro de URL).
  - **`shared/ui/Paginacion.tsx`:** `nav` con nombre, "Anterior", números con `aria-current="page"` y "Siguiente".
  - **`features/consulta/components/ListaCreditos.tsx`:** 5 por página, resumen "Mostrando X–Y de N créditos" (`aria-live`), controles solo con más de 5 y desplazamiento al inicio de los resultados al cambiar de página.
  - **`ConsultaCreditosPage`:** la página va en la URL (`&pagina=N`; la 1 no se escribe) y una búsqueda nueva la reinicia.
  - **Corrección de bug:** `RutaProtegida` recordaba solo `pathname` y perdía los parámetros al pasar por el login. Ahora guarda `pathname + search`.
  - **Pruebas web:** 164 (26 nuevas).
    - `paginar` y `leerPagina` (15).
    - Paginación en la pantalla (10): exactamente 5 sin controles; 7 con los primeros 5 y la página 1 activa; siguiente con la URL y **sin nueva petición**; anterior; volver a la página 1 sin escribirla; URL con `pagina=3`; `pagina` 99, 0 y abc ajustadas; búsqueda nueva que reinicia la página.
    - Navegación (1): los parámetros se conservan tras el login.
    - Cobertura de la web: 99 % de líneas; `Paginacion` al 100 %.
  - **Documentación:** README (paginación y enlaces con parámetros) y `docs/ARCHITECTURE.md` (sección Paginación de la consulta).
- **Decisiones y ajustes manuales:**
  - **Paginación en el cliente:** la API devuelve todos los créditos de un solo cliente, que son pocos, así que no se cambió su contrato. Si un cliente pudiera acumular cientos, habría que paginar en el servidor; quedó documentado.
  - **Página en la URL,** con el mismo criterio que la cédula en [017]: se puede compartir y sobrevive al recargo. Los valores inválidos se ajustan, sin error.
  - **Bug encontrado al verificar en el navegador:** al abrir `/creditos?cedula=…` sin sesión, el login devolvía a `/creditos` sin la cédula. Primero se escribió una prueba que lo reprodujo (falló) y después se corrigió `RutaProtegida` (pasó).
  - **Cobertura:** el botón "Anterior" quedaba sin probar (función de `Paginacion` al 83 %); se agregó la prueba.
  - **Prueba de mutación:** mostrar los controles siempre (`>= 1` en lugar de `> 1`) rompe la prueba "exactamente 5 sin paginación". El componente se restauró.
  - **Verificación manual en el navegador,** reutilizando el Vite del usuario; la API se levantó para la prueba y se detuvo al terminar:
    - se crearon **7 créditos de prueba en `dev.db`** para el cliente ficticio "Prueba Paginación" (`001-010101-0099P`, solicitudes #43 a #49, `CR-2026-000005` a `CR-2026-000011`);
    - la página 1 muestra 5 con los controles al final; la página 2 muestra 2, con la URL actualizada y sin nueva petición a la API;
    - después del logout, el enlace `…&pagina=2` pasó por el login y llegó directo a la página 2.
  - **Verificación final:** typecheck, lint, Prettier y build en verde; pruebas de shared (95), api (151) y web (164).
- **Commits:** `feat(web): agregar paginación reutilizable`, `feat(consulta): paginar el listado de créditos cuando supera 5`, `fix(web): conservar los parámetros de la url al volver del login`, `docs: documentar la paginación de la consulta`, `docs(ai-log): registrar pr de la paginación de la consulta`
- **PR:** [#16](https://github.com/nestordgt27/SimulacionCredito/pull/16) → `develop`
