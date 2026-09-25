import { Periodicidad, TipoEmpleo } from '@simulacion-credito/shared';
import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../../src/prisma/prisma.service';

let secuencia = 0;
const siguiente = () => ++secuencia;

export function crearUsuario(
  prisma: PrismaService,
  datos: Partial<Prisma.UsuarioCreateInput> = {},
) {
  const n = siguiente();
  return prisma.usuario.create({
    data: {
      username: `usuario${n}`,
      passwordHash: 'hash-de-prueba',
      nombreCompleto: `Usuario ${n}`,
      rol: 'ANALISTA',
      ...datos,
    },
  });
}

export function crearCliente(
  prisma: PrismaService,
  datos: Partial<Prisma.ClienteCreateInput> = {},
) {
  const n = siguiente();
  return prisma.cliente.create({
    data: {
      cedula: `001-010190-${String(n).padStart(4, '0')}A`,
      nombreCompleto: `Cliente ${n}`,
      correo: `cliente${n}@correo.com`,
      telefono: '88888888',
      fechaNacimiento: new Date('1990-01-01T00:00:00Z'),
      ...datos,
    },
  });
}

export async function crearSolicitud(
  prisma: PrismaService,
  datos: Partial<Prisma.SolicitudUncheckedCreateInput> = {},
) {
  const clienteId = datos.clienteId ?? (await crearCliente(prisma)).id;
  const creadaPorId = datos.creadaPorId ?? (await crearUsuario(prisma)).id;

  return prisma.solicitud.create({
    data: {
      tipoEmpleo: TipoEmpleo.ASALARIADO,
      empresa: 'Empresa S.A.',
      antiguedadLaboralAnios: 3,
      ingresoMensualCentavos: 2_500_000,
      montoSolicitadoCentavos: 1_000_000,
      cantidadCuotas: 12,
      tasaAnualBps: 1200,
      periodicidad: Periodicidad.MENSUAL,
      cuotaNiveladaCentavos: 88_849,
      ...datos,
      clienteId,
      creadaPorId,
    },
  });
}

export async function crearCredito(
  prisma: PrismaService,
  datos: Partial<Prisma.CreditoUncheckedCreateInput> = {},
) {
  const solicitudId = datos.solicitudId ?? (await crearSolicitud(prisma)).id;

  return prisma.credito.create({
    data: {
      numeroCredito: `CR-2026-${String(siguiente()).padStart(6, '0')}`,
      montoCentavos: 1_000_000,
      tasaAnualBps: 1200,
      periodicidad: Periodicidad.MENSUAL,
      cantidadCuotas: 12,
      cuotaNiveladaCentavos: 88_849,
      fechaAprobacion: new Date('2026-09-25T00:00:00Z'),
      ...datos,
      solicitudId,
    },
  });
}
