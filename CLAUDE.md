# Instrucciones del proyecto — Prueba Técnica: Ciclo de vida de una solicitud de crédito

> **Leer este archivo completo antes de cada iteración de código.**
> Si una petición contradice estas reglas, señalarlo y proponer alternativa **antes** de implementar.
> Este archivo es la fuente única de verdad sobre arquitectura, calidad, pruebas, Git y registro de IA.

---

## 0. Protocolo obligatorio de cada iteración

1. **Leer** este archivo y la última entrada de `docs/AI_LOG.md`.
2. **Rama:** confirmar en qué rama se trabaja o proponer una nueva según la sección 7. Nunca trabajar directo sobre `main` ni `develop`.
3. **Plan breve:** qué capa(s) se tocan, qué archivos, qué pruebas se escribirán.
4. **Implementar** siguiendo las secciones 2–6. En lógica de dominio y casos de uso, escribir la prueba primero o junto al código, nunca después "si da tiempo".
5. **Verificar** el checklist de la sección 9.
6. **Proponer commits** atómicos con Conventional Commits (sección 7).
7. **Registrar** la iteración en `docs/AI_LOG.md` (sección 8): prompt, rama, commits, decisiones y correcciones.

---

## 1. Contexto y stack

| Capa | Tecnología |
|---|---|
| Monorepo | npm workspaces |
| Backend | NestJS + TypeScript (strict) |
| ORM / BD | Prisma + SQLite (archivo en volumen Docker) |
| Frontend | React + Vite + TypeScript, React Router, TanStack Query, React Hook Form + Zod |
| Paquete compartido | `packages/shared`: cálculos financieros, enums, validaciones puras |
| Pruebas | Jest (api), Vitest + Testing Library + MSW (web), Supertest (e2e) |
| Infra | Dockerfile por app + `docker-compose.yml` en la raíz, Nginx como proxy `/api` |

`tsconfig` en modo `strict: true`. Prohibido `any` salvo justificación en comentario.

---

## 2. Arquitectura

### 2.1 Estructura del repositorio

```
/
├── apps/
│   ├── api/
│   └── web/
├── packages/
│   └── shared/
├── docs/
│   ├── ARCHITECTURE.md
│   └── AI_LOG.md
├── CLAUDE.md
├── docker-compose.yml
└── README.md
```

### 2.2 Backend: capas con inversión de dependencias (hexagonal ligera)

Cada módulo de negocio (`auth`, `solicitudes`, `comite`, `desembolsos`, `creditos`) se organiza así:

```
apps/api/src/
├── modules/
│   └── <modulo>/
│       ├── domain/          # Entidades, value objects, reglas, errores de dominio,
│       │                    # puertos (interfaces de repositorio/servicios). SIN Nest ni Prisma.
│       ├── application/     # Casos de uso: una clase = una acción (AprobarSolicitudUseCase)
│       ├── infrastructure/  # Adaptadores: repositorios Prisma, mappers dominio <-> persistencia
│       ├── presentation/    # Controllers y DTOs HTTP (class-validator)
│       └── <modulo>.module.ts
├── core/                    # Kernel compartido: Clock, UnitOfWork, errores base,
│                            # filtro global de excepciones, guards, decoradores
└── prisma/                  # PrismaService, schema, migraciones, seed
```

**Regla de dependencia (no negociable):**

```
presentation ──> application ──> domain <── infrastructure
```

- `domain` no importa nada de `@nestjs/*`, `@prisma/client`, ni de otras capas.
- `application` depende de **interfaces** (puertos) definidas en `domain`, nunca de implementaciones concretas.
- Los adaptadores se inyectan con tokens de Nest (`{ provide: SOLICITUD_REPOSITORY, useClass: PrismaSolicitudRepository }`).
- Los controllers solo traducen HTTP ↔ caso de uso. Sin lógica de negocio en controllers.

### 2.3 Transaccionalidad

- Puerto `UnitOfWork` en `core` con `run<T>(fn: () => Promise<T>): Promise<T>`.
- Implementación con `prisma.$transaction` (vía `@nestjs-cls/transactional` + adaptador Prisma, o implementación propia equivalente).
- **Aprobar solicitud** (cambio de estado + creación de crédito + creación de todas las cuotas) y **desembolsar** se ejecutan siempre dentro de `UnitOfWork.run`. Si falla cualquier paso, no queda nada persistido.

### 2.4 Paquete `shared`

- Solo funciones puras y tipos: `calcularCuotaNivelada`, `generarPlanPagos`, `calcularEdad`, `calcularPlazoMeses`, enums `Periodicidad`, `EstadoSolicitud`, `Banco`, `TipoEmpleo`.
- Sin dependencias de framework. Única dependencia externa permitida: `decimal.js` (o similar) para precisión.
- El frontend y el backend **deben** usar estas funciones; está prohibido reimplementar el cálculo en otro lugar.

### 2.5 Frontend: organización por features

```
apps/web/src/
├── app/            # Router, providers (QueryClient, Auth), layout
├── features/
│   └── <feature>/  # auth, solicitudes, comite, desembolsos, consulta
│       ├── api/        # llamadas HTTP de la feature
│       ├── hooks/      # useQuery / useMutation que envuelven api/
│       ├── components/
│       ├── pages/
│       └── schemas/    # esquemas Zod
└── shared/
    ├── api/        # cliente Axios + interceptores (token, refresh)
    ├── ui/         # componentes genéricos reutilizables
    └── lib/
```

- Los componentes **no** llaman a Axios directamente: componente → hook → api.
- Las páginas componen; la lógica reutilizable vive en hooks.
- Validación de formularios con Zod, reutilizando reglas de `shared` (edad máxima, rangos).

---

## 3. Principios SOLID aplicados al proyecto

- **S — Responsabilidad única:** un caso de uso por acción (`CrearSolicitudUseCase`, `AprobarSolicitudUseCase`, `RechazarSolicitudUseCase`, `DesembolsarCreditoUseCase`). Generar el número de crédito, generar el plan de pagos y validar transiciones son responsabilidades separadas.
- **O — Abierto/cerrado:** la periodicidad se resuelve con un mapa/estrategia (`Periodicidad → { n, avanzarFecha }`), no con `switch` repetidos. Agregar una periodicidad nueva no modifica los cálculos.
- **L — Sustitución de Liskov:** cualquier implementación de un puerto (repositorio Prisma, repositorio en memoria para tests) debe cumplir el mismo contrato sin que el caso de uso lo note.
- **I — Segregación de interfaces:** puertos pequeños y específicos (`SolicitudRepository`, `CreditoRepository`, `NumeroCreditoGenerator`, `PasswordHasher`, `TokenService`, `Clock`). Nada de un `DatabaseService` gigante.
- **D — Inversión de dependencias:** los casos de uso reciben interfaces por constructor. `new` de dependencias de infraestructura dentro de la lógica está prohibido.

### 3.1 Otras reglas de diseño

- **Máquina de estados centralizada:** `SolicitudStateMachine.assertTransicion(actual, destino)` en `domain`. Ningún otro lugar decide si una transición es válida.
- **Tiempo inyectable:** toda lógica que dependa de "hoy" (edad, fechas de vencimiento, expiración de tokens) usa el puerto `Clock`. Prohibido `new Date()` directo en `domain` y `application`.
- **Dinero:** montos persistidos en **centavos (enteros)**. Cálculos con `decimal.js`. Redondeo a 2 decimales solo en el borde (presentación/persistencia).
- **Errores de dominio tipados** (`SolicitudNoEncontradaError`, `TransicionInvalidaError`, `EdadNoPermitidaError`, `ObservacionesRequeridasError`) mapeados a HTTP por un filtro global (404, 409, 422). Nunca lanzar `HttpException` desde `domain`.
- **DRY con criterio:** extraer cuando hay duplicación real de conocimiento, no por parecido superficial.
- **Nombres en español para el dominio** (Solicitud, Credito, CuotaPlan), inglés para términos técnicos (Repository, UseCase, Controller).
- Sin código muerto, sin `console.log` (usar `Logger` de Nest), sin comentarios que repitan el código.

---

## 4. Reglas de negocio (fuente única)

| Regla | Detalle |
|---|---|
| Periodicidad (n) | Anual = 1, Mensual = 12, Quincenal = 24 |
| Tasa periódica | `i = (tasaAnual / 100) / n` |
| Cuota nivelada | `M * [i(1+i)^c] / [(1+i)^c − 1]`; si `i = 0` → `M / c` |
| Redondeo | Cada cuota a 2 decimales; la última ajusta el residuo para que el saldo final sea exactamente 0 |
| Redondeo (detalle) | `ROUND_HALF_UP`. El interés de cada periodo se redondea a 2 decimales sobre el saldo; capital = cuota − interés. El monto admite como máximo 2 decimales |
| Plazo | Derivado: `plazoMeses = cuotas * 12 / n` |
| Edad | Rechazar si el cliente tiene **más de 80 años**. Validar en frontend (UX) y backend (regla real) |
| Estados | `PENDIENTE → APROBADA`, `PENDIENTE → RECHAZADA`, `APROBADA → DESEMBOLSADA`. Todo lo demás es inválido |
| Aprobación | Observaciones obligatorias. En una sola transacción: estado → APROBADA, crear crédito con número único, crear N cuotas |
| Número de crédito | Incremental con formato `CR-AAAA-NNNNNN` |
| Aprobación (detalle) | `fechaAprobacion` = momento del dictamen según el `Clock` (UTC); el año del número es el de esa fecha. El cambio de estado es condicional al estado anterior (409 si otra petición lo cambió). El rechazo no exige observaciones |
| Número de crédito (detalle) | Tabla `Secuencia` con clave `CREDITO-AAAA`: la numeración se reinicia cada año y se incrementa dentro de la transacción de aprobación |
| Persistencia | Montos en centavos y tasas en puntos básicos (`Int`). La tasa admite máximo 2 decimales. Máximo por monto: 2 147 483 647 centavos (`Int` de 32 bits en el cliente de Prisma) |
| Fechas de vencimiento | Desde la fecha de aprobación: +15 días (quincenal), +1 mes (mensual), +1 año (anual) |
| Fechas (detalle) | Aritmética en UTC. La cuota k vence en `inicio + k periodos` (sin encadenar). Si el día no existe en el mes destino se usa el último día del mes (31/01 + 1 mes = 28 o 29/02) |
| Edad (implementación) | `EDAD_MAXIMA = 80` y `esEdadPermitida` en `shared`. El backend la aplica en `Solicitud.crear` con el `Clock` (422 `EDAD_NO_PERMITIDA`); una fecha de nacimiento futura da 422 `FECHA_NACIMIENTO_INVALIDA` |
| Cuota enviada por el frontend | Se acepta en `credito.cuotaNivelada` para no romper clientes, pero se ignora siempre |
| Cliente | Identificado por cédula (`000-000000-0000X`, en mayúsculas). Una solicitud nueva de una cédula existente actualiza los datos del cliente (gana la última captura) |
| Límites de captura | Monto mayor que 0 hasta 21 474 836,47; tasa de 0 a 100 %; montos y tasa con máximo 2 decimales; de 1 a 360 cuotas |
| Edad (detalle) | `calcularEdad(fechaNacimiento, fechaReferencia)`: la referencia es un parámetro para mantener la función pura (backend la toma del `Clock`). Nacidos un 29/02 cumplen el 01/03 en años no bisiestos |
| Desembolso | Solo desde APROBADA. Requiere banco (LAFISE, FICOHSA, BAC Credomatic, Banpro) y número de cuenta |
| Desembolso (detalle) | `POST /desembolsos/:solicitudId` con `banco` (enum `Banco` de shared) y `numeroCuenta` (texto de 6 a 20 dígitos). Siempre por el monto total del crédito y una sola vez (`creditoId` único). Estado + historial + desembolso en una transacción; 409 desde cualquier estado distinto de APROBADA |
| Consulta de créditos | `GET /creditos?cedula=` devuelve los créditos otorgados del cliente (más reciente primero) con su plan de pagos y el desembolso sin número de cuenta; lista vacía si no tiene. Cédula normalizada como al registrar |
| Comité | Vista de solo lectura: cédula, nombre, edad, cuotas, periodicidad, plazo, monto |
| Seguridad | Access token JWT de corta duración; refresh token rotativo, guardado hasheado, revocable |
| Seguridad en el frontend | Access token solo en memoria; refresh token y usuario en `localStorage` para sobrevivir al recargo (compromiso frente a cookie HttpOnly). Interceptor Axios: un solo refresh compartido ante 401 concurrentes y un único reintento por petición; si el refresh falla se cierra la sesión |
| Seguridad (detalle) | Access 15 min (HS256); refresh opaco de 7 días, guardado en SHA-256 y enviado en el cuerpo JSON. La reutilización de un token rotado revoca toda la familia. `refresh` es público; `logout` exige access token y revoca solo la familia del refresh token indicado. Todo lo demás exige JWT (`JwtAuthGuard` global + `@Public()`) |

El backend **siempre recalcula** la cuota; nunca confía en la enviada por el frontend.

Cualquier supuesto nuevo se agrega aquí y en la sección "Supuestos" del README.

---

## 5. Patrones esperados y antipatrones

**Usar:** Repository, Use Case / Application Service, Unit of Work, Strategy (periodicidad), Factory/Builder (creación de entidades y datos de prueba), Mapper (dominio ↔ persistencia ↔ DTO), State Machine.

**Evitar:**
- Lógica de negocio en controllers, componentes React o repositorios.
- Entidades anémicas cuando la regla pertenece a la entidad (ej. `solicitud.aprobar(observaciones, clock)`).
- Acceso a Prisma fuera de `infrastructure`.
- Servicios "Dios" que hacen todo un flujo sin separar responsabilidades.
- Sobreingeniería: no crear abstracciones sin un segundo uso o sin necesidad de test.

---

## 6. Pruebas

### 6.1 Pirámide

| Nivel | Qué cubre | Herramienta | Dependencias |
|---|---|---|---|
| Unitarias | `shared`, entidades, máquina de estados, casos de uso | Jest / Vitest | Puertos **mockeados** |
| Integración | Repositorios Prisma, UnitOfWork (rollback real) | Jest | SQLite de prueba real |
| E2E | Flujos HTTP críticos | Jest + Supertest | App completa + SQLite de prueba |
| Frontend | Comportamiento de pantallas y hooks | Vitest + Testing Library + MSW | HTTP mockeado con MSW |

### 6.2 Reglas de mocks

- **Mockear solo puertos** (fronteras): repositorios, `Clock`, `UnitOfWork`, `PasswordHasher`, `TokenService`, `NumeroCreditoGenerator`.
- **Nunca mockear** entidades de dominio ni funciones puras de `shared`: se prueban con datos reales.
- **Nunca mockear Prisma** en pruebas unitarias; los casos de uso no saben que Prisma existe. Prisma se prueba en integración con SQLite real.
- Mocks tipados: `jest.Mocked<SolicitudRepository>` o `createMock<T>()` (`@golevelup/ts-jest`). Prohibido `as any`.
- `Clock` siempre con fecha fija en pruebas (edad, vencimientos, expiración de tokens).
- `UnitOfWork` en unitarias: fake que ejecuta la función directamente; el rollback real se prueba en integración.
- Verificar interacciones (`toHaveBeenCalledWith`) solo cuando la interacción **es** el comportamiento esperado (ej. que no se guarden cuotas si la transición es inválida). En lo demás, verificar el resultado.
- Reiniciar mocks entre pruebas (`jest.clearAllMocks` / `beforeEach`).
- En frontend, mockear HTTP con **MSW**, no los hooks ni Axios.

### 6.3 Estilo

- Patrón **AAA** (Arrange / Act / Assert) con líneas en blanco separando bloques.
- Nombres: `debe <resultado esperado> cuando <condición>`.
- Un comportamiento por prueba.
- Datos de prueba con builders: `unaSolicitud().conFechaNacimiento('1940-01-01').pendiente().build()`.
- En frontend, consultar por rol/texto accesible (`getByRole`), no por clases ni ids de implementación.
- Pruebas deterministas: sin dependencias de hora real, orden de ejecución ni red.

### 6.4 Casos obligatorios

- Cuota nivelada para las 3 periodicidades, tasa 0 y redondeo (suma de capital = monto, saldo final = 0).
- Rechazo de solicitud por edad > 80 (y aceptación con exactamente 80).
- Todas las transiciones válidas e inválidas de la máquina de estados.
- Aprobar sin observaciones → error.
- Aprobar → se crean crédito y exactamente N cuotas.
- Fallo durante la creación de cuotas → rollback completo (integración).
- Desembolsar solicitud PENDIENTE o RECHAZADA → error 409.
- Login inválido, token expirado, refresh rotado y refresh reutilizado.

### 6.5 Cobertura mínima

`packages/shared`: 100 %. `domain` y `application`: ≥ 90 %. Global: ≥ 80 %.

---

## 7. Git

### 7.1 Ramas

| Rama | Uso |
|---|---|
| `main` | Entregable estable. Solo recibe PR desde `develop`. Protegida |
| `develop` | Integración. Recibe PR desde ramas de trabajo |
| `feature/<area>-<descripcion>` | Funcionalidad nueva (ej. `feature/comite-aprobar-solicitud`) |
| `fix/<descripcion>` | Corrección de errores |
| `test/<descripcion>` | Solo pruebas |
| `refactor/<descripcion>` | Refactor sin cambio de comportamiento |
| `docs/<descripcion>` | Documentación |
| `chore/<descripcion>` | Configuración, dependencias, Docker, CI |

- Las ramas se crean **desde `develop`** y vuelven a `develop` por Pull Request.
- Nombres en minúsculas, kebab-case, sin tildes.
- Una rama = un objetivo. Ramas cortas; borrar después del merge.
- Única excepción: el commit inicial del repositorio puede ir directo a `main`, desde donde se crea `develop`.
- Toda rama creada se registra en la tabla "Registro de ramas" de `docs/AI_LOG.md`.

### 7.2 Commits (Conventional Commits)

Formato: `<tipo>(<alcance>): <descripción en español, imperativo, minúsculas>`

```
feat(comite): aprobar solicitud y generar plan de pagos en una transacción
fix(shared): ajustar residuo de redondeo en la última cuota
test(desembolsos): cubrir rechazo de desembolso en estado pendiente
chore(docker): agregar healthcheck al servicio api
```

Tipos: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `style`, `perf`, `build`, `ci`.

- Commits atómicos: un cambio lógico por commit, con sus pruebas.
- Las pruebas deben pasar antes de cada commit.
- Nunca commitear secretos, `.env` ni archivos `.db`. Mantener `.env.example`.

### 7.3 Pull Requests

Cada PR incluye: objetivo, cambios principales, decisiones de diseño, cómo probar y referencia a las entradas de `AI_LOG.md` relacionadas. El PR final `develop → main` resume la arquitectura y enlaza la bitácora completa.

---

## 8. Registro de uso de IA (`docs/AI_LOG.md`)

Cada interacción con IA que produzca o modifique código, arquitectura o documentación se registra **en la misma iteración**, nunca reconstruida al final.

Formato de entrada:

```markdown
### [NNN] AAAA-MM-DD — Título corto

- **Herramienta:** Claude (claude.ai / Claude Code), Copilot, etc.
- **Rama:** feature/...
- **Prompt (resumen fiel):** ...
- **Resultado:** qué se generó o cambió.
- **Decisiones y ajustes manuales:** qué se aceptó, qué se corrigió y por qué.
- **Commits:** `tipo(alcance): mensaje`
```

Además, mantener actualizada la tabla **Registro de ramas** al inicio del archivo (rama, propósito, origen, PR, estado).

---

## 9. Checklist antes de cerrar una iteración (Definition of Done)

- [ ] Se respeta la regla de dependencia entre capas.
- [ ] Sin lógica de negocio en controllers, componentes ni repositorios.
- [ ] Cálculos financieros solo desde `packages/shared`.
- [ ] Sin `new Date()` en dominio/aplicación; se usa `Clock`.
- [ ] Transiciones de estado solo vía la máquina de estados.
- [ ] Operaciones multi-tabla dentro de `UnitOfWork`.
- [ ] Pruebas nuevas/actualizadas, siguiendo las reglas de mocks, y todas en verde.
- [ ] Lint y `tsc --noEmit` sin errores.
- [ ] Trabajo en la rama correcta; commits con Conventional Commits.
- [ ] README / `ARCHITECTURE.md` actualizados si cambió algo relevante.
- [ ] Entrada registrada en `docs/AI_LOG.md` y tabla de ramas al día.
