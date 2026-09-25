import { Inject, Injectable } from '@nestjs/common';
import type { EstadoSolicitud, Periodicidad } from '@simulacion-credito/shared';
import { CLOCK, type Clock } from '../../../core/domain/clock';
import { desdeCentavos, desdePuntosBasicos } from '../../../core/domain/dinero';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../core/domain/unit-of-work';
import { Credito } from '../../creditos/domain/credito';
import {
  CREDITO_REPOSITORY,
  type CreditoRepository,
} from '../../creditos/domain/credito.repository';
import {
  NUMERO_CREDITO_GENERATOR,
  type NumeroCreditoGenerator,
} from '../../creditos/domain/numero-credito.generator';
import {
  SOLICITUD_REPOSITORY,
  type SolicitudRepository,
} from '../../solicitudes/domain/solicitud.repository';
import { buscarSolicitud, registrarTransicion } from '../../solicitudes/application/transiciones';

export interface AprobarSolicitudComando {
  solicitudId: number;
  observaciones: string;
  evaluadorId: number;
}

export interface ResultadoAprobacion {
  solicitudId: number;
  estado: EstadoSolicitud;
  observaciones: string | null;
  credito: {
    numeroCredito: string;
    fechaAprobacion: Date;
    monto: number;
    tasaAnual: number;
    cantidadCuotas: number;
    periodicidad: Periodicidad;
    cuotaNivelada: number;
  };
}

// Todo ocurre en una sola transacción (CLAUDE.md §2.3): verificar que esté PENDIENTE,
// pasarla a APROBADA, generar el número y crear el crédito con todas sus cuotas.
// Cualquier error revierte los cuatro pasos, incluido el consumo del número de crédito.
@Injectable()
export class AprobarSolicitudUseCase {
  constructor(
    @Inject(SOLICITUD_REPOSITORY) private readonly solicitudes: SolicitudRepository,
    @Inject(CREDITO_REPOSITORY) private readonly creditos: CreditoRepository,
    @Inject(NUMERO_CREDITO_GENERATOR) private readonly numeros: NumeroCreditoGenerator,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  ejecutar({
    solicitudId,
    observaciones,
    evaluadorId,
  }: AprobarSolicitudComando): Promise<ResultadoAprobacion> {
    return this.unitOfWork.run(async () => {
      const ahora = this.clock.ahora();
      const pendiente = await buscarSolicitud(this.solicitudes, solicitudId);
      const aprobada = pendiente.aprobar(observaciones, evaluadorId, ahora);
      await registrarTransicion(this.solicitudes, aprobada, {
        estadoAnterior: pendiente.estado,
        usuarioId: evaluadorId,
        fecha: ahora,
        comentario: aprobada.observaciones,
      });

      const numeroCredito = await this.numeros.generar(ahora.getUTCFullYear());
      const credito = Credito.otorgar(
        {
          solicitudId: aprobada.id,
          montoCentavos: aprobada.condiciones.montoCentavos,
          tasaAnualBps: aprobada.condiciones.tasaAnualBps,
          periodicidad: aprobada.condiciones.periodicidad,
          cantidadCuotas: aprobada.condiciones.cantidadCuotas,
          cuotaNiveladaCentavos: aprobada.cuotaNiveladaCentavos,
        },
        numeroCredito,
        ahora,
      );
      await this.creditos.crear(credito);

      return {
        solicitudId: aprobada.id,
        estado: aprobada.estado,
        observaciones: aprobada.observaciones,
        credito: {
          numeroCredito: credito.numeroCredito,
          fechaAprobacion: credito.fechaAprobacion,
          monto: desdeCentavos(credito.montoCentavos),
          tasaAnual: desdePuntosBasicos(credito.tasaAnualBps),
          cantidadCuotas: credito.cantidadCuotas,
          periodicidad: credito.periodicidad,
          cuotaNivelada: desdeCentavos(credito.cuotaNiveladaCentavos),
        },
      };
    });
  }
}
