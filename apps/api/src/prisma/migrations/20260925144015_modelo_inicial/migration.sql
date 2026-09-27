-- CreateTable
CREATE TABLE "usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,
    "expiraEn" DATETIME NOT NULL,
    "revocadoEn" DATETIME,
    "reemplazadoPorId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "refresh_tokens_reemplazadoPorId_fkey" FOREIGN KEY ("reemplazadoPorId") REFERENCES "refresh_tokens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cedula" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "fechaNacimiento" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "solicitudes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clienteId" INTEGER NOT NULL,
    "tipoEmpleo" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "antiguedadLaboralAnios" INTEGER NOT NULL,
    "ingresoMensualCentavos" INTEGER NOT NULL,
    "montoSolicitadoCentavos" INTEGER NOT NULL,
    "cantidadCuotas" INTEGER NOT NULL,
    "tasaAnualBps" INTEGER NOT NULL,
    "periodicidad" TEXT NOT NULL,
    "cuotaNiveladaCentavos" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "evaluadaPorId" INTEGER,
    "fechaEvaluacion" DATETIME,
    "creadaPorId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "solicitudes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitudes_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitudes_evaluadaPorId_fkey" FOREIGN KEY ("evaluadaPorId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "solicitudes_historial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "solicitudId" INTEGER NOT NULL,
    "estadoAnterior" TEXT,
    "estadoNuevo" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "comentario" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "solicitudes_historial_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitudes_historial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "creditos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroCredito" TEXT NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "montoCentavos" INTEGER NOT NULL,
    "tasaAnualBps" INTEGER NOT NULL,
    "periodicidad" TEXT NOT NULL,
    "cantidadCuotas" INTEGER NOT NULL,
    "cuotaNiveladaCentavos" INTEGER NOT NULL,
    "fechaAprobacion" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "creditos_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cuotas_plan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creditoId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "fechaVencimiento" DATETIME NOT NULL,
    "cuotaCentavos" INTEGER NOT NULL,
    "capitalCentavos" INTEGER NOT NULL,
    "interesCentavos" INTEGER NOT NULL,
    "saldoCentavos" INTEGER NOT NULL,
    CONSTRAINT "cuotas_plan_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "creditos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "desembolsos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creditoId" INTEGER NOT NULL,
    "banco" TEXT NOT NULL,
    "numeroCuenta" TEXT NOT NULL,
    "montoCentavos" INTEGER NOT NULL,
    "desembolsadoPorId" INTEGER NOT NULL,
    "fechaDesembolso" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "desembolsos_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "creditos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "desembolsos_desembolsadoPorId_fkey" FOREIGN KEY ("desembolsadoPorId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "secuencias" (
    "clave" TEXT NOT NULL PRIMARY KEY,
    "valor" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_reemplazadoPorId_key" ON "refresh_tokens"("reemplazadoPorId");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuarioId_idx" ON "refresh_tokens"("usuarioId");

-- CreateIndex
CREATE INDEX "refresh_tokens_familiaId_idx" ON "refresh_tokens"("familiaId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cedula_key" ON "clientes"("cedula");

-- CreateIndex
CREATE INDEX "solicitudes_estado_idx" ON "solicitudes"("estado");

-- CreateIndex
CREATE INDEX "solicitudes_clienteId_idx" ON "solicitudes"("clienteId");

-- CreateIndex
CREATE INDEX "solicitudes_historial_solicitudId_idx" ON "solicitudes_historial"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "creditos_numeroCredito_key" ON "creditos"("numeroCredito");

-- CreateIndex
CREATE UNIQUE INDEX "creditos_solicitudId_key" ON "creditos"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "cuotas_plan_creditoId_numero_key" ON "cuotas_plan"("creditoId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "desembolsos_creditoId_key" ON "desembolsos"("creditoId");
