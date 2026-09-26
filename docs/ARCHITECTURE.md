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
│   │   ├── domain/           # Puertos Clock y UnitOfWork, ErrorDeDominio, conversión de dinero
│   │   ├── health/           # GET /api/health (público)
│   │   ├── http/             # configureApp (prefijo /api, CORS) y filtro de errores de dominio
│   │   └── infrastructure/   # SystemClock
│   ├── modules/
│   │   ├── auth/             # Implementado: login, refresh, logout, JwtAuthGuard global
│   │   ├── solicitudes/      # Implementado: crear y listar solicitudes
│   │   ├── comite/           # Implementado: vista reducida, aprobar y rechazar
│   │   ├── desembolsos/      # Implementado: desembolsar una solicitud aprobada
│   │   └── creditos/         # Crédito y plan de pagos; consulta por cédula (GET /creditos)
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

## Módulo `solicitudes`

| Capa             | Contenido                                                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain`         | Entidad `Solicitud` (`crear` y `reconstituir`), `Cliente`, errores `EdadNoPermitidaError` y `FechaNacimientoInvalidaError`, y puerto `SolicitudRepository` |
| `application`    | `CrearSolicitudUseCase`, `ListarSolicitudesUseCase` y `SolicitudVista` (salida en unidades, con edad y plazo derivados)                                    |
| `infrastructure` | `PrismaSolicitudRepository`: upsert del cliente por cédula, solicitud e historial inicial (`null → PENDIENTE`)                                             |
| `presentation`   | `SolicitudesController`, `CrearSolicitudDto` (anidado: `cliente`, `empleo`, `credito`) y `ListarSolicitudesQuery`                                          |

- **La cuota no se puede inyectar:** `Solicitud.crear` aplica la regla de edad y calcula la cuota con `calcularCuotaNivelada`. No hay otra forma de construir una solicitud nueva. `reconstituir` solo se usa al leer de la base.
- **Unidades en los bordes:** el DTO y la vista trabajan en unidades y porcentaje. El dominio y la base, en centavos y puntos básicos (`core/domain/dinero.ts`).
- **Atomicidad:** `CrearSolicitudUseCase` persiste dentro del `UnitOfWork`. Si falla la solicitud o el historial, el upsert del cliente también se revierte (probado en integración).
- **Tiempo:** la fecha de creación y la edad salen del `Clock`.

## Módulos `comite` y `creditos`

| Módulo / capa             | Contenido                                                                                                                                                                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `solicitudes/domain`      | `SolicitudStateMachine` (única fuente de transiciones), `Solicitud.aprobar` / `rechazar` (inmutables; devuelven una solicitud nueva) y errores `SolicitudNoEncontradaError` (404), `TransicionInvalidaError` (409) y `ObservacionesRequeridasError` (422) |
| `creditos/domain`         | `Credito.otorgar` (copia las condiciones aprobadas y genera el plan con `generarPlanPagos`, en centavos), `formatearNumeroCredito`, y puertos `CreditoRepository` y `NumeroCreditoGenerator`                                                              |
| `creditos/infrastructure` | `PrismaCreditoRepository` (crédito + `createMany` de cuotas) y `PrismaNumeroCreditoGenerator` (upsert con incremento atómico en `secuencias`, clave `CREDITO-AAAA`)                                                                                       |
| `comite/application`      | `ObtenerSolicitudComiteUseCase`, `AprobarSolicitudUseCase` y `RechazarSolicitudUseCase`                                                                                                                                                                   |
| `comite/presentation`     | `ComiteController` y DTOs de evaluación                                                                                                                                                                                                                   |

- **Una sola transacción:** `AprobarSolicitudUseCase` ejecuta todo dentro de `unitOfWork.run` (`prisma.$transaction`): leer, `aprobar` (máquina de estados), `registrarEvaluacion` (condicional al estado anterior + historial), generar el número y crear el crédito con sus cuotas. Cualquier error revierte los pasos anteriores, incluido el incremento de la secuencia.
- **Rollback probado con un fallo real:** la prueba de integración reemplaza `CREDITO_REPOSITORY` por una subclase que repite una cuota. La base rechaza el `createMany` (`P2002`) después de insertar el crédito y consumir el número, y se verifica que el estado, el historial, el crédito, las cuotas y la secuencia quedan intactos.
- **Consulta de créditos (modelo de lectura):** `ConsultaCreditos` (`creditos/domain`) es un puerto solo de lectura, separado de `CreditoRepository` (escritura), según la segregación de interfaces. `PrismaConsultaCreditos` resuelve crédito + estado de la solicitud + cliente + desembolso + cuotas en una sola consulta, sin reconstruir entidades. `ConsultarCreditosUseCase` convierte a unidades y deriva el plazo con `calcularPlazoMeses`. `GET /creditos?cedula=` lo expone con `CreditosController`.
- **Transiciones compartidas:** `solicitudes/application/transiciones.ts` (`buscarSolicitud`, `registrarTransicion`) lo usan el comité y los desembolsos. `SolicitudRepository.registrarTransicion` recibe explícitamente quién ejecuta el cambio, la fecha y el comentario del historial.
- **Dependencias entre módulos:** `ComiteModule` importa `SolicitudesModule` y `CreditosModule`, que exportan los tokens de sus puertos. El comité no tiene dominio propio.

## Módulo `desembolsos`

| Capa             | Contenido                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain`         | `Desembolso.registrar` (monto total del crédito) y puerto `DesembolsoRepository`                                                                                                                        |
| `application`    | `DesembolsarCreditoUseCase`: dentro del `UnitOfWork`, `Solicitud.desembolsar` (máquina de estados, solo desde `APROBADA`), busca el crédito, `registrarTransicion` condicional y registra el desembolso |
| `infrastructure` | `PrismaDesembolsoRepository` (`creditoId` único: un desembolso por crédito)                                                                                                                             |
| `presentation`   | `DesembolsosController` (`POST /desembolsos/:solicitudId`) y `DesembolsarDto`                                                                                                                           |

- `CreditoRepository.buscarPorSolicitud` devuelve un `CreditoResumen` (`id`, `numeroCredito`, `montoCentavos`). Si una solicitud `APROBADA` no tuviera crédito (dato inconsistente), responde `404 CREDITO_NO_ENCONTRADO`.
- **Rollback probado:** con un desembolso previo para el mismo crédito, el `INSERT` viola `UNIQUE(creditoId)` después de cambiar el estado, y se verifica que la solicitud vuelve a quedar `APROBADA` con su historial intacto.

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
├── app/                  # App, providers, QueryClient, rutas, RutaProtegida, layout
├── features/
│   ├── auth/             # api/ hooks/ components/ pages/ schemas/ (login y logout)
│   ├── solicitudes/      # formulario de registro con cuota en vivo y bloqueo por edad
│   ├── comite/           # bandeja de pendientes, revisión (7 campos) y dictamen
│   ├── desembolsos/      # bandeja de aprobadas, datos bancarios, confirmación y resultado
│   └── consulta/         # búsqueda por cédula, tarjetas de crédito y plan de pagos
├── shared/
│   ├── api/              # clienteHttp (Axios + interceptores) y mensajeDeError
│   ├── auth/             # sesionStore y useSesion
│   ├── lib/              # formatearMonto (C$), formatearMeses, formatearFecha, sumarMontos, paginar y etiquetas
│   └── ui/               # Boton, Campo, AreaTexto, Selector, Seccion, Paginacion, Alerta, Tarjeta (Tailwind)
└── test/                 # setup, servidor MSW con handlers y renderApp
```

- **Proxy de desarrollo**: Vite redirige `/api` a `API_PROXY_TARGET` (por defecto `http://localhost:3000`). El frontend siempre llama a rutas relativas `/api/...`, igual que detrás de Nginx.
- **Rutas**: `app/routes.tsx` define las rutas como datos (`RouteObject[]`). Así las pruebas las montan con `createMemoryRouter` sin duplicarlas. `/login` es pública; el resto cuelga de `RutaProtegida`, que redirige al login recordando la ruta pedida (`state.desde`).
- **Flujo por capas** (`CLAUDE.md` §2.5): componente → hook (`useMutation` / `useQuery`) → `api/` → `clienteHttp`. Las páginas componen, los formularios reciben callbacks y la lógica vive en hooks.

### Registro de solicitudes

- **Esquema Zod** (`crearSolicitudSchema(hoy)`): refleja las reglas del DTO de la API con los mismos límites, formato de cédula y edad máxima de `packages/shared` (`LIMITES_SOLICITUD`, `FORMATO_CEDULA`, `EDAD_MAXIMA`). Así el front y el back no divergen (`CLAUDE.md` §2.5). La fecha de referencia es un parámetro para poder probarlo con una fecha fija.
- **`useCuotaEstimada`:** valida las condiciones del crédito con el sub-esquema y, si son válidas, calcula la cuota y el plazo con shared. Mientras estén incompletas o sean inválidas devuelve `null` (se muestra "—").
- **Bloqueo por edad:** el formulario calcula la edad con la fecha de nacimiento observada (`useWatch`). Si supera 80 años, muestra un aviso (`role="alert"`) y deshabilita el envío; el esquema también lo rechaza. La regla real sigue en el backend (422 `EDAD_NO_PERMITIDA`).
- **Envío:** `useCrearSolicitud` hace el POST con los datos normalizados (cédula en mayúsculas, correo en minúsculas) y sin cuota. Al terminar invalida las consultas `['solicitudes']`.

### Comité

- **Bandeja:** `useSolicitudesPendientes` usa `GET /solicitudes?estado=PENDIENTE` con la clave `['solicitudes', { estado: 'PENDIENTE' }]`, y muestra estados de carga, lista vacía y error.
- **Revisión:** `useSolicitudComite(id)` usa `GET /comite/solicitudes/:id`. Un id no numérico redirige a la bandeja.
- **Dictamen:** es un solo campo de observaciones con dos acciones de reglas distintas (`aprobacionSchema` exige texto; `rechazoSchema` lo deja opcional y envía `{}` si está vacío). Por eso cada botón valida con su esquema, en lugar de usar un resolver único.
- **Consistencia:** `useAprobarSolicitud` y `useRechazarSolicitud` invalidan el prefijo `['solicitudes']`, así la bandeja no muestra solicitudes ya evaluadas.
- **Limitación conocida:** la vista del comité no incluye el estado, porque el enunciado pide solo 7 campos. Si se abre una solicitud ya evaluada, el formulario de dictamen aparece, pero el backend responde `409` y se muestra su mensaje.

### Desembolsos

- **Bandeja:** `useSolicitudesAprobadas` usa `GET /solicitudes?estado=APROBADA` con la clave `['solicitudes', { estado: 'APROBADA' }]`.
- **Resumen sin endpoint nuevo:** la página de desembolso toma la solicitud de esa misma lista (ya en caché si se llega desde la bandeja). Si no está entre las aprobadas, muestra un aviso en lugar del formulario. Así también evita desembolsar una solicitud ya desembolsada.
- **Validación con reglas compartidas:** `desembolsoSchema` usa `Banco` y `FORMATO_NUMERO_CUENTA` de `packages/shared`, igual que el DTO de la API.
- **Confirmación explícita:** el formulario tiene dos pasos (datos, luego confirmación) porque el desembolso mueve dinero y es irreversible. Los errores del backend (por ejemplo, `409`) se muestran en el paso de confirmación.
- **Invalidación:** `useDesembolsar` invalida `['solicitudes']` y `['creditos']`.

### Consulta de créditos

- **Estado en la URL:** la cédula buscada vive en `?cedula=` (`useSearchParams`); `cedulaValida` la normaliza con el mismo formato de shared. Una cédula inválida en la URL se ignora y no genera ninguna petición.
- **Consulta:** `useCreditosPorCedula(cedula)` usa `GET /creditos?cedula=` con la clave `['creditos', cedula]`, solo con una cédula válida (`enabled`). El desembolso invalida `['creditos']`.
- **Plan de pagos:** usa los mismos nombres que `generarPlanPagos` y se despliega a pedido (`aria-expanded` y `aria-controls`). Los totales se calculan con `sumarMontos`, en centavos enteros, para que el capital sume exactamente el monto.

### Paginación de la consulta

- **En el cliente:** `GET /creditos?cedula=` devuelve todos los créditos de un solo cliente (en la práctica, pocos), así que `ListaCreditos` los pagina sin cambiar el contrato de la API. Si un cliente pudiera acumular cientos de créditos, convendría pasar a paginación en el servidor (`page`/`limit` en la API).
- **Reglas:** 5 por página (`CREDITOS_POR_PAGINA`), y los controles aparecen solo con más de 5. `paginar()` (`shared/lib`, función pura) ajusta una página fuera de rango a la primera o a la última; `leerPagina()` interpreta el parámetro de URL (`0`, `abc` o `1.5` equivalen a 1).
- **URL:** `?cedula=…&pagina=N`. La página 1 no se escribe, y una búsqueda nueva la reinicia. Cambiar de página no vuelve a consultar la API (los datos ya están en caché) y desplaza la vista al inicio de los resultados.
- **Accesibilidad:** `Paginacion` es un `nav` con nombre, la página actual lleva `aria-current="page"`, y el resumen "Mostrando X–Y de N" es `aria-live="polite"`.
- **Ruta protegida con parámetros:** `RutaProtegida` recuerda `pathname + search`, así un enlace compartido con cédula y página llega a su destino después del login.

### Sesión e interceptores

- **`sesionStore`** (`shared/auth`) es un almacén fuera de React, porque lo usan el interceptor y los componentes (vía `useSesion`, con `useSyncExternalStore`).
  - El access token vive solo en memoria.
  - En `localStorage` se persisten el refresh token y el usuario (`restaurar()` al cargar).
  - Si el almacenamiento no está disponible, la sesión dura lo que la pestaña.
- **Interceptor de request:** agrega `Authorization: Bearer <accessToken>` si hay sesión.
- **Interceptor de response:** ante un `401` llama a `/auth/refresh` y reintenta la petición **una vez** (marca `_reintentada`). No refresca en `/auth/login` ni en `/auth/refresh`, ni sin sesión.
- **Single-flight:** las peticiones que reciben `401` a la vez comparten una sola promesa de refresh. Es imprescindible, porque el backend trata un refresh token ya rotado como reutilización y revocaría la sesión.
- **Refresh fallido:** `sesionStore.cerrar()` y se propaga el `401` original. `RutaProtegida` se vuelve a renderizar y lleva al login.
- **Recarga de la página:** la sesión se restaura sin access token. La primera petición recibe `401`, se refresca y se reintenta sin que el usuario lo note.
- **`QueryClient`:** no reintenta errores 4xx; los 5xx y los errores de red se reintentan hasta 2 veces. Las mutaciones no se reintentan.

### Pruebas del frontend

- **HTTP mockeado con MSW** (`src/test/msw`), nunca los hooks ni Axios (`CLAUDE.md` §6.2). `onUnhandledRequest: 'error'` hace fallar cualquier petición sin handler.
- **`renderApp(ruta)`** monta la app completa con las rutas reales.
- **Limpieza:** entre pruebas se borran la sesión y `localStorage`.
- **Fecha fija en pruebas:** `vi.useFakeTimers({ toFake: ['Date'] })` solo simula `Date`; los timers reales siguen funcionando para user-event y MSW.
- **Consultas accesibles:** por rol y texto (`getByRole`, `getByLabelText`).

## Pruebas

| Paquete  | Unitarias                                        | Integración / e2e                                                                                                                 |
| -------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `shared` | Vitest                                           | —                                                                                                                                 |
| `api`    | Jest (`src/**/*.spec.ts`), con puertos mockeados | Integración: Jest + SQLite real (`test/**/*.int-spec.ts`). E2E: Jest + Supertest (`test/**/*.e2e-spec.ts`). Ambas con `.env.test` |
| `web`    | Vitest + Testing Library + jsdom + MSW           | —                                                                                                                                 |
