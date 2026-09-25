# Bitácora de uso de IA

Registro de cada interacción con herramientas de IA durante el desarrollo, según la sección 8 de `CLAUDE.md`.

## Registro de ramas

| Rama | Propósito | Creada desde | PR | Estado |
|---|---|---|---|---|
| `main` | Commit inicial: `.gitignore`, `LICENSE` | — | — | Activa |
| `develop` | Rama de integración | `main` | — | Activa |
| `docs/instrucciones-proyecto` | Agregar `CLAUDE.md` y `docs/AI_LOG.md` | `develop` | [#1](https://github.com/nestordgt27/SimulacionCredito/pull/1) | En revisión |

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
