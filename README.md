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

# 3. Crear la base de datos de desarrollo (data/dev.db) y generar el cliente de Prisma
npm run prisma:migrate -w @simulacion-credito/api

# 4. Crear el usuario de prueba (ver "Usuario de prueba")
npm run prisma:seed -w @simulacion-credito/api

# 5. Levantar api (http://localhost:3000/api) y web (http://localhost:5173)
npm run dev
```

La web redirige `/api` a la API mediante el proxy de Vite, así que en el navegador todo se sirve desde `http://localhost:5173`.

## Usuario de prueba

El seed crea un usuario para iniciar sesión en desarrollo:

| Usuario | Contraseña  | Rol     |
| ------- | ----------- | ------- |
| `admin` | `Admin123!` | `ADMIN` |

- **Solo para desarrollo:** el seed se niega a ejecutarse con `NODE_ENV=production`. No uses estas credenciales fuera de tu máquina.
- **Idempotente:** se puede ejecutar las veces que haga falta. Si el usuario ya existe, restablece la contraseña documentada y lo reactiva.
- **Contraseña:** se guarda como hash **Argon2id**, nunca en texto plano. Es el mismo algoritmo que usará el login (puerto `PasswordHasher`).
- **Ejecución automática:** `prisma migrate dev` ejecuta el seed cuando crea o reinicia la base de datos. Para una base existente, usa `npm run prisma:seed -w @simulacion-credito/api`.
- **Código:** [`apps/api/src/prisma/seed.ts`](apps/api/src/prisma/seed.ts) (punto de entrada) y [`apps/api/src/prisma/seed/usuario-admin.seed.ts`](apps/api/src/prisma/seed/usuario-admin.seed.ts) (datos y lógica).

## Autenticación

Todas las rutas de la API exigen `Authorization: Bearer <accessToken>`, salvo las marcadas como públicas.

| Método y ruta            | Acceso    | Cuerpo                   | Respuesta                  |
| ------------------------ | --------- | ------------------------ | -------------------------- |
| `POST /api/auth/login`   | Pública   | `{ username, password }` | `200` con la sesión        |
| `POST /api/auth/refresh` | Pública   | `{ refreshToken }`       | `200` con una sesión nueva |
| `POST /api/auth/logout`  | Protegida | `{ refreshToken }`       | `204`                      |
| `GET /api/health`        | Pública   | —                        | `200 { status: "ok" }`     |

Sesión que devuelven `login` y `refresh`:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "q3V0...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "usuario": {
    "id": 1,
    "username": "admin",
    "nombreCompleto": "Administrador de prueba",
    "rol": "ADMIN"
  }
}
```

- **Access token:** JWT HS256 de 15 minutos. No se guarda en la base de datos.
- **Refresh token:** valor aleatorio de 256 bits, válido 7 días. Se guarda solo su hash SHA-256.
- **Rotación:** cada `refresh` revoca el token usado y entrega uno nuevo de la misma sesión (familia).
- **Reutilización:** si llega un refresh token ya usado (posible robo), se revoca toda la sesión y se responde `401 REFRESH_TOKEN_REUTILIZADO`.
- **Logout:** revoca la sesión del refresh token indicado. Las demás sesiones del usuario (otros dispositivos) siguen activas.
- **`refresh` es público** porque se llama precisamente cuando el access token ya expiró.

Errores (`401`): `CREDENCIALES_INVALIDAS`, `ACCESS_TOKEN_INVALIDO`, `REFRESH_TOKEN_INVALIDO` y `REFRESH_TOKEN_REUTILIZADO`, con el formato `{ statusCode, error, message }`.

Ejemplo:

```bash
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"Admin123!"}'
```

## Solicitudes

Rutas protegidas: requieren access token.

| Método y ruta                           | Descripción                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/solicitudes`                 | Registra una solicitud en estado `PENDIENTE`. Responde `201`                                                              |
| `GET /api/solicitudes?estado=PENDIENTE` | Lista solicitudes, las más recientes primero. `estado` es opcional: `PENDIENTE`, `APROBADA`, `RECHAZADA` o `DESEMBOLSADA` |

Cuerpo de `POST` (montos en unidades, tasa en porcentaje anual):

```json
{
  "cliente": {
    "cedula": "001-150385-0007K",
    "nombreCompleto": "Luis Martínez",
    "correo": "luis@correo.com",
    "telefono": "87654321",
    "fechaNacimiento": "1985-03-15"
  },
  "empleo": {
    "tipoEmpleo": "INDEPENDIENTE",
    "empresa": "Taller Martínez",
    "antiguedadLaboralAnios": 8,
    "ingresoMensual": 32000
  },
  "credito": {
    "monto": 50000,
    "tasaAnual": 18.5,
    "cantidadCuotas": 24,
    "periodicidad": "QUINCENAL"
  }
}
```

La respuesta (y cada elemento del listado) agrega `id`, `estado`, `observaciones`, `creadaEn`, `cliente.edad`, `credito.plazoMeses` y `credito.cuotaNivelada`.

- **La cuota la calcula siempre el servidor** con `calcularCuotaNivelada` de `packages/shared`. Si el cliente envía `credito.cuotaNivelada`, se acepta pero se ignora.
- **Edad:** se calcula a la fecha del servidor. Con 80 años se acepta; desde 81 se responde `422 EDAD_NO_PERMITIDA`. Una fecha de nacimiento futura responde `422 FECHA_NACIMIENTO_INVALIDA`.
- **Validación (`400`):**
  - cédula `000-000000-0000X`;
  - correo válido y teléfono de 8 a 15 dígitos;
  - fecha `YYYY-MM-DD` real;
  - monto mayor que 0, e ingreso de 0 o más, ambos con hasta 2 decimales y un máximo de 21 474 836,47;
  - tasa de 0 a 100 con hasta 2 decimales;
  - cuotas enteras de 1 a 360;
  - `periodicidad` y `tipoEmpleo` con los valores de `shared`.
- **Cliente:** se identifica por cédula. Si ya existe, se actualizan sus datos con los de la nueva solicitud.

## Variables de entorno

| Archivo                 | Versionado | Uso                                                         |
| ----------------------- | ---------- | ----------------------------------------------------------- |
| `apps/api/.env.example` | Sí         | Plantilla para desarrollo                                   |
| `apps/api/.env`         | No         | Configuración local de desarrollo (`data/dev.db`)           |
| `apps/api/.env.test`    | Sí         | Pruebas de integración y e2e (`data/test.db`); sin secretos |
| `apps/web/.env.example` | Sí         | Plantilla del frontend                                      |
| `apps/web/.env`         | No         | Configuración local del frontend                            |

Variables de la API:

| Variable                  | Ejemplo                  | Descripción                                                |
| ------------------------- | ------------------------ | ---------------------------------------------------------- |
| `NODE_ENV`                | `development`            | `development`, `test` o `production`                       |
| `PORT`                    | `3000`                   | Puerto HTTP de la API                                      |
| `DATABASE_URL`            | `file:../../data/dev.db` | Ruta SQLite, relativa a `src/prisma/schema.prisma`         |
| `CORS_ORIGIN`             | `http://localhost:5173`  | Origen permitido del frontend                              |
| `JWT_ACCESS_SECRET`       | (aleatorio)              | Secreto para firmar el access token (mínimo 32 caracteres) |
| `JWT_ACCESS_TTL_SEGUNDOS` | `900`                    | Vigencia del access token (15 minutos)                     |
| `REFRESH_TOKEN_TTL_DIAS`  | `7`                      | Vigencia del refresh token                                 |

Las variables se validan al arrancar: si falta alguna o es inválida, la API no inicia.

Genera tu propio `JWT_ACCESS_SECRET` para `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Variables del frontend:

| Variable           | Ejemplo                 | Descripción                      |
| ------------------ | ----------------------- | -------------------------------- |
| `API_PROXY_TARGET` | `http://localhost:3000` | Destino del proxy `/api` de Vite |

## Scripts (desde la raíz)

| Script                                        | Descripción                                              |
| --------------------------------------------- | -------------------------------------------------------- |
| `npm run dev`                                 | Levanta api y web en paralelo                            |
| `npm run build`                               | Compila shared, api y web                                |
| `npm test`                                    | Pruebas unitarias de todos los paquetes                  |
| `npm run test:int -w @simulacion-credito/api` | Pruebas de integración con SQLite real (usa `.env.test`) |
| `npm run test:e2e -w @simulacion-credito/api` | Pruebas e2e de la API (usa `.env.test`)                  |
| `npm run lint`                                | Lint de todos los paquetes                               |
| `npm run typecheck`                           | `tsc` sin emitir en todos los paquetes                   |
| `npm run format`                              | Formatea con Prettier                                    |

Base de datos (`-w @simulacion-credito/api`):

| Script                | Descripción                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `prisma:generate`     | Genera el cliente de Prisma                                                               |
| `prisma:migrate`      | Crea y aplica migraciones sobre `data/dev.db`                                             |
| `prisma:seed`         | Crea o restablece el usuario de prueba en `data/dev.db` (idempotente)                     |
| `prisma:migrate:test` | Aplica las migraciones sobre `data/test.db` (se ejecuta antes de `test:int` y `test:e2e`) |
| `prisma:studio`       | Abre Prisma Studio                                                                        |

## Supuestos

Supuestos técnicos del entorno. Los supuestos de negocio se agregan a medida que se implementan (ver `CLAUDE.md` §4).

- **Versiones fijadas por compatibilidad con Node 22.13:** NestJS 11 (el CLI 12 falla en esta versión de Node), Prisma 6 (Prisma 8 exige Node ≥ 22.18), React Router 7 (la 8 exige Node ≥ 22.22) y TypeScript 5.9 (`ts-jest` aún no soporta TypeScript 7).
- **SQLite local en `apps/api/data/`** solo para desarrollo, mientras no se dockeriza. La carpeta está en `.gitignore` (salvo `.gitkeep`).
- **Linter:** ESLint con reglas de tipos en la api; oxlint en la web (el que genera la plantilla de Vite).

Supuestos de negocio (detalle en `CLAUDE.md` §4):

- **Redondeo:** `ROUND_HALF_UP` a 2 decimales. El interés de cada periodo se redondea sobre el saldo pendiente y la última cuota paga el saldo restante, por lo que puede diferir en centavos de la cuota nivelada (ejemplo: 10 000 al 12 % en 12 cuotas mensuales → 11 cuotas de 888,49 y una última de 888,47).
- **Monto:** como máximo 2 decimales.
- **Tasa 0:** la cuota es `monto / cuotas`, y la última absorbe el centavo restante.
- **Fechas de vencimiento:** se calculan en UTC desde la fecha de aprobación, sin encadenar: la cuota k vence en `inicio + k periodos`. Si el día no existe en el mes destino, se usa el último día del mes.
- **Edad:** se calcula en años cumplidos a una fecha de referencia que se pasa como parámetro (el "hoy" del `Clock` en el backend). Quien nació un 29 de febrero cumple años el 1 de marzo en los años no bisiestos.
- **Plazo:** `cuotas · 12 / n`; puede ser fraccionario (3 cuotas quincenales = 1,5 meses). No se persiste: se deriva.
- **Persistencia de montos y tasas:** montos en centavos y tasas en puntos básicos (18,50 % = 1850), ambos enteros. Por eso la tasa admite como máximo 2 decimales. El cliente de Prisma maneja `Int` de 32 bits, así que el monto máximo es 21 474 836,47.
- **Número de crédito:** la secuencia se reinicia cada año (`CR-2026-000001`, `CR-2027-000001`), porque el año forma parte del número.
- **Cliente:** se identifica por cédula única y puede tener varias solicitudes. La información laboral se guarda en cada solicitud como foto del momento. Al registrar una solicitud de una cédula existente, se actualizan los datos del cliente (gana la última captura).
- **Límites de captura:** hasta 360 cuotas y tasa de 0 a 100 %, con máximo 2 decimales en montos y tasa.
