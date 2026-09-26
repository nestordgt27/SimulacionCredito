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

## Frontend

Aplicación React + Vite en `http://localhost:5173` (`npm run dev`). Inicia sesión con el [usuario de prueba](#usuario-de-prueba).

| Pieza                 | Uso                                              |
| --------------------- | ------------------------------------------------ |
| React Router          | Rutas; las privadas pasan por `RutaProtegida`    |
| TanStack Query        | Estado del servidor (consultas y mutaciones)     |
| React Hook Form + Zod | Formularios y validación                         |
| Axios                 | Cliente HTTP con interceptores (token y refresh) |
| Tailwind CSS v4       | Estilos                                          |

Pantallas disponibles:

- **Login**, con validación de campos y el mensaje del backend ante credenciales inválidas.
- **Inicio**, protegido, con el nombre del usuario y un botón para cerrar sesión.
- **Nueva solicitud** (`/solicitudes/nueva`): formulario en tres secciones.
  - **Datos personales, información laboral y condiciones del crédito.**
  - **Cuota nivelada y plazo en vivo**, calculados con `calcularCuotaNivelada` y `calcularPlazoMeses` de `packages/shared` (las mismas funciones que usa el backend). Son informativos: el servidor recalcula la cuota al registrar y el frontend no la envía.
  - **Bloqueo por edad:** si el cliente tiene más de 80 años, aparece un aviso claro y el botón "Registrar solicitud" queda deshabilitado. Con 80 años exactos se permite.
  - **Al registrar**, muestra el número de solicitud y la cuota confirmada por el servidor.
- **Comité** (`/comite`): bandeja de solicitudes `PENDIENTE`, con cliente, cédula, monto, cuotas y fecha de registro. Cada fila tiene un enlace a su revisión.
- **Revisión** (`/comite/:id`):
  - **Ficha de solo lectura** con los 7 campos del enunciado: cédula, nombre, edad, cuotas, periodicidad, plazo y monto.
  - **Dictamen:** **Aprobar** exige observaciones; **Rechazar** las deja opcionales.
  - **Resultado:** al aprobar se muestra el número de crédito otorgado y la cuota. Después de cualquier dictamen, la bandeja se actualiza sola.
  - **Conflictos:** si la solicitud ya no estaba pendiente, se muestra el mensaje del backend (`409`).
- **Desembolsos** (`/desembolsos`): créditos aprobados pendientes de desembolso, con monto y cuota. Cada fila tiene un enlace para desembolsar.
- **Desembolso** (`/desembolsos/:solicitudId`):
  - **Resumen del crédito aprobado.**
  - **Datos bancarios:** banco (LAFISE, FICOHSA, BAC Credomatic o Banpro) y número de cuenta (6 a 20 dígitos).
  - **Confirmación:** antes de enviar se muestra "Vas a desembolsar C$ … a … en …, cuenta …", con opción de corregir.
  - **Resultado:** se muestran el número de crédito, el banco, la cuenta y la fecha.
  - **Solicitud no disponible:** si no está aprobada o ya se desembolsó, se muestra un aviso en lugar del formulario.
- **Consulta** (`/creditos`): búsqueda de créditos por cédula.
  - **Cédula normalizada:** se aceptan minúsculas.
  - **Búsqueda en la URL** (`/creditos?cedula=…`): se puede compartir, sobrevive al recargo y funciona con "atrás".
  - **Una tarjeta por crédito:** número, estado (aprobado o desembolsado), monto, tasa, cuotas, plazo, cuota nivelada, fecha de aprobación y banco y fecha del desembolso.
  - **Plan de pagos desplegable:** número, vencimiento, cuota, capital, interés y saldo, con totales. La suma del capital coincide exactamente con el monto.

**Sesión:**

- El access token se guarda **solo en memoria**.
- En `localStorage` se guardan únicamente el refresh token y los datos del usuario, para mantener la sesión al recargar.
- Todas las peticiones llevan `Authorization: Bearer`.
- Ante un `401`, el interceptor llama a `/auth/refresh` **una sola vez**, aunque fallen varias peticiones a la vez, y las reintenta con el nuevo token.
- Si el refresh falla, cierra la sesión y la app vuelve al login.

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

## Comité

Rutas protegidas: requieren access token.

| Método y ruta                               | Cuerpo                             | Respuesta                                       |
| ------------------------------------------- | ---------------------------------- | ----------------------------------------------- |
| `GET /api/comite/solicitudes/:id`           | —                                  | `200`: vista reducida de la solicitud           |
| `POST /api/comite/solicitudes/:id/aprobar`  | `{ observaciones }` (obligatorias) | `200`: solicitud aprobada y crédito otorgado    |
| `POST /api/comite/solicitudes/:id/rechazar` | `{ observaciones? }` (opcionales)  | `200`: `{ solicitudId, estado, observaciones }` |

Vista reducida (solo los campos del enunciado):

```json
{
  "cedula": "001-150385-0007K",
  "nombreCompleto": "Luis Martínez",
  "edad": 41,
  "cantidadCuotas": 24,
  "periodicidad": "QUINCENAL",
  "plazoMeses": 12,
  "monto": 50000
}
```

Respuesta de la aprobación:

```json
{
  "solicitudId": 36,
  "estado": "APROBADA",
  "observaciones": "Ingresos estables y buen historial",
  "credito": {
    "numeroCredito": "CR-2026-000001",
    "fechaAprobacion": "2026-09-25T17:14:57.578Z",
    "monto": 50000,
    "tasaAnual": 18.5,
    "cantidadCuotas": 24,
    "periodicidad": "QUINCENAL",
    "cuotaNivelada": 2289.98
  }
}
```

- **Aprobación atómica:** en un solo `prisma.$transaction` se verifica que la solicitud esté `PENDIENTE`, se pasa a `APROBADA` (con el historial), se genera el número `CR-AAAA-NNNNNN` y se crean el crédito y todas sus cuotas con `generarPlanPagos`. Si algo falla, no queda nada a medias; tampoco se consume el número de crédito.
- **Transiciones:** solo `PENDIENTE → APROBADA`, `PENDIENTE → RECHAZADA` y `APROBADA → DESEMBOLSADA`. Cualquier otra responde `409 TRANSICION_INVALIDA`.
- **Concurrencia:** el cambio de estado es condicional (`WHERE estado = 'PENDIENTE'`). Si dos personas aprueban a la vez, solo una lo logra y la otra recibe `409`.
- **Errores:**
  - `404 SOLICITUD_NO_ENCONTRADA`;
  - `422 OBSERVACIONES_REQUERIDAS` al aprobar con observaciones vacías;
  - `400` si falta el campo `observaciones` o el id no es numérico.

## Desembolsos

Ruta protegida: requiere access token.

| Método y ruta                        | Cuerpo                    | Respuesta                          |
| ------------------------------------ | ------------------------- | ---------------------------------- |
| `POST /api/desembolsos/:solicitudId` | `{ banco, numeroCuenta }` | `201` con los datos del desembolso |

- **`banco`:** `LAFISE`, `FICOHSA`, `BAC_CREDOMATIC` o `BANPRO` (enum `Banco` de `packages/shared`).
- **`numeroCuenta`:** texto de 6 a 20 dígitos. Se guarda como texto para conservar los ceros a la izquierda.

```json
{
  "solicitudId": 36,
  "estado": "DESEMBOLSADA",
  "desembolso": {
    "numeroCredito": "CR-2026-000001",
    "banco": "BAC_CREDOMATIC",
    "numeroCuenta": "0012345678",
    "monto": 50000,
    "fechaDesembolso": "2026-09-25T17:44:51.563Z"
  }
}
```

- **Una transacción:** se valida que la solicitud esté `APROBADA`, se pasa a `DESEMBOLSADA` (con su entrada de historial) y se registra el desembolso por el monto total del crédito. Si algo falla, no queda nada a medias.
- **Errores:**
  - `409 TRANSICION_INVALIDA` si la solicitud está `PENDIENTE`, `RECHAZADA` o ya `DESEMBOLSADA`;
  - `404` si no existe;
  - `400` con un banco fuera de la lista, un número de cuenta inválido o un id no numérico.

## Consulta de créditos

Ruta protegida: requiere access token.

| Método y ruta                               | Respuesta                                                           |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `GET /api/creditos?cedula=001-150385-0007K` | `200`: créditos del cliente con su plan de pagos (`[]` si no tiene) |

```json
[
  {
    "numeroCredito": "CR-2026-000001",
    "solicitudId": 36,
    "estado": "DESEMBOLSADA",
    "fechaAprobacion": "2026-09-25T17:14:57.578Z",
    "cliente": { "cedula": "001-150385-0007K", "nombreCompleto": "Luis Martínez" },
    "monto": 50000,
    "tasaAnual": 18.5,
    "cantidadCuotas": 24,
    "periodicidad": "QUINCENAL",
    "plazoMeses": 12,
    "cuotaNivelada": 2289.98,
    "desembolso": { "banco": "BAC_CREDOMATIC", "fechaDesembolso": "2026-09-25T17:44:51.563Z" },
    "planPagos": [
      {
        "numero": 1,
        "fechaVencimiento": "2026-10-10T17:14:57.578Z",
        "cuota": 2289.98,
        "capital": 1904.56,
        "interes": 385.42,
        "saldo": 48095.44
      },
      {
        "numero": 24,
        "fechaVencimiento": "2027-09-20T17:14:57.578Z",
        "cuota": 2289.9,
        "capital": 2272.38,
        "interes": 17.52,
        "saldo": 0
      }
    ]
  }
]
```

(En el ejemplo, `planPagos` se muestra abreviado.)

- **Cédula:** se normaliza igual que al registrar la solicitud (sin espacios y en mayúsculas), así que `001-150385-0007k` también funciona. Un formato inválido o una cédula ausente responde `400`.
- **Qué se incluye:** solo créditos otorgados (solicitudes aprobadas o desembolsadas), del más reciente al más antiguo.
- **`desembolso`:** es `null` hasta que el crédito se desembolsa. **No incluye el número de cuenta.**
- **`planPagos`:** usa los mismos nombres que `generarPlanPagos` de `packages/shared` (`numero`, `fechaVencimiento`, `cuota`, `capital`, `interes`, `saldo`), en unidades.

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
- **Sesión en el frontend:** el access token solo vive en memoria. El refresh token se guarda en `localStorage` para sobrevivir al recargo; es un compromiso frente a una cookie HttpOnly, que requeriría cambiar el backend (ver `CLAUDE.md` §4).
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
- **Aprobación:** la fecha de aprobación es el momento del dictamen (UTC) y es la base de los vencimientos. El año del número de crédito es el de esa fecha.
- **Rechazo:** las observaciones son opcionales.
- **Desembolso:** siempre por el monto total del crédito y una sola vez. El número de cuenta acepta solo dígitos (de 6 a 20).
- **Límites de captura:** hasta 360 cuotas y tasa de 0 a 100 %, con máximo 2 decimales en montos y tasa.
