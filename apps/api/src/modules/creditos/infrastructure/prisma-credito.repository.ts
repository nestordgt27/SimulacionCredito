import { Injectable } from '@nestjs/common';
import { PrismaTransactionContext } from '../../../prisma/prisma-transaction-context';
import type { Credito } from '../domain/credito';
import type { CreditoRepository, CreditoResumen } from '../domain/credito.repository';

@Injectable()
export class PrismaCreditoRepository implements CreditoRepository {
  constructor(private readonly contexto: PrismaTransactionContext) {}

  async crear(credito: Credito): Promise<void> {
    const { id: creditoId } = await this.contexto.cliente.credito.create({
      data: {
        numeroCredito: credito.numeroCredito,
        solicitudId: credito.solicitudId,
        montoCentavos: credito.montoCentavos,
        tasaAnualBps: credito.tasaAnualBps,
        periodicidad: credito.periodicidad,
        cantidadCuotas: credito.cantidadCuotas,
        cuotaNiveladaCentavos: credito.cuotaNiveladaCentavos,
        fechaAprobacion: credito.fechaAprobacion,
      },
    });

    await this.contexto.cliente.cuotaPlan.createMany({
      data: credito.cuotas.map((cuota) => ({ creditoId, ...cuota })),
    });
  }

  buscarPorSolicitud(solicitudId: number): Promise<CreditoResumen | null> {
    return this.contexto.cliente.credito.findUnique({
      where: { solicitudId },
      select: { id: true, numeroCredito: true, montoCentavos: true },
    });
  }
}
