import { Inject, Injectable } from '@nestjs/common';
import {
  calcularPlazoMeses,
  type Banco,
  type EstadoSolicitud,
  type Periodicidad,
} from '@simulacion-credito/shared';
import { desdeCentavos, desdePuntosBasicos } from '../../../core/domain/dinero';
import {
  CONSULTA_CREDITOS,
  type ConsultaCreditos,
  type CreditoDetalle,
} from '../domain/consulta-creditos';

// Mismos nombres que el CuotaPlan de generarPlanPagos (packages/shared), en unidades.
export interface CuotaPlanVista {
  numero: number;
  fechaVencimiento: Date;
  cuota: number;
  capital: number;
  interes: number;
  saldo: number;
}

export interface CreditoVista {
  numeroCredito: string;
  solicitudId: number;
  estado: EstadoSolicitud;
  fechaAprobacion: Date;
  cliente: { cedula: string; nombreCompleto: string };
  monto: number;
  tasaAnual: number;
  cantidadCuotas: number;
  periodicidad: Periodicidad;
  plazoMeses: number;
  cuotaNivelada: number;
  desembolso: { banco: Banco; fechaDesembolso: Date } | null;
  planPagos: CuotaPlanVista[];
}

const aVista = (credito: CreditoDetalle): CreditoVista => ({
  numeroCredito: credito.numeroCredito,
  solicitudId: credito.solicitudId,
  estado: credito.estado,
  fechaAprobacion: credito.fechaAprobacion,
  cliente: credito.cliente,
  monto: desdeCentavos(credito.montoCentavos),
  tasaAnual: desdePuntosBasicos(credito.tasaAnualBps),
  cantidadCuotas: credito.cantidadCuotas,
  periodicidad: credito.periodicidad,
  plazoMeses: calcularPlazoMeses(credito.cantidadCuotas, credito.periodicidad),
  cuotaNivelada: desdeCentavos(credito.cuotaNiveladaCentavos),
  desembolso: credito.desembolso,
  planPagos: credito.cuotas.map((cuota) => ({
    numero: cuota.numero,
    fechaVencimiento: cuota.fechaVencimiento,
    cuota: desdeCentavos(cuota.cuotaCentavos),
    capital: desdeCentavos(cuota.capitalCentavos),
    interes: desdeCentavos(cuota.interesCentavos),
    saldo: desdeCentavos(cuota.saldoCentavos),
  })),
});

@Injectable()
export class ConsultarCreditosUseCase {
  constructor(@Inject(CONSULTA_CREDITOS) private readonly consulta: ConsultaCreditos) {}

  async porCedula(cedula: string): Promise<CreditoVista[]> {
    const creditos = await this.consulta.porCedula(cedula);
    return creditos.map(aVista);
  }
}
