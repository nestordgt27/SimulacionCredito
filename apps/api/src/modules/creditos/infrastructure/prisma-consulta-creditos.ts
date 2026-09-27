import { Injectable } from '@nestjs/common';
import type { Banco, EstadoSolicitud, Periodicidad } from '@simulacion-credito/shared';
import { PrismaTransactionContext } from '../../../prisma/prisma-transaction-context';
import type { ConsultaCreditos, CreditoDetalle } from '../domain/consulta-creditos';

@Injectable()
export class PrismaConsultaCreditos implements ConsultaCreditos {
  constructor(private readonly contexto: PrismaTransactionContext) {}

  async porCedula(cedula: string): Promise<CreditoDetalle[]> {
    const registros = await this.contexto.cliente.credito.findMany({
      where: { solicitud: { cliente: { cedula } } },
      include: {
        solicitud: { select: { estado: true, cliente: true } },
        desembolso: { select: { banco: true, fechaDesembolso: true } },
        cuotas: { orderBy: { numero: 'asc' } },
      },
      orderBy: [{ fechaAprobacion: 'desc' }, { id: 'desc' }],
    });

    // Los enums se guardan como texto y solo los escribe el dominio (CLAUDE.md §4).
    return registros.map((registro) => ({
      numeroCredito: registro.numeroCredito,
      solicitudId: registro.solicitudId,
      estado: registro.solicitud.estado as EstadoSolicitud,
      fechaAprobacion: registro.fechaAprobacion,
      cliente: {
        cedula: registro.solicitud.cliente.cedula,
        nombreCompleto: registro.solicitud.cliente.nombreCompleto,
      },
      montoCentavos: registro.montoCentavos,
      tasaAnualBps: registro.tasaAnualBps,
      cantidadCuotas: registro.cantidadCuotas,
      periodicidad: registro.periodicidad as Periodicidad,
      cuotaNiveladaCentavos: registro.cuotaNiveladaCentavos,
      desembolso: registro.desembolso
        ? {
            banco: registro.desembolso.banco as Banco,
            fechaDesembolso: registro.desembolso.fechaDesembolso,
          }
        : null,
      cuotas: registro.cuotas.map((cuota) => ({
        numero: cuota.numero,
        fechaVencimiento: cuota.fechaVencimiento,
        cuotaCentavos: cuota.cuotaCentavos,
        capitalCentavos: cuota.capitalCentavos,
        interesCentavos: cuota.interesCentavos,
        saldoCentavos: cuota.saldoCentavos,
      })),
    }));
  }
}
