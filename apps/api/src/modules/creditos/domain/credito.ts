import {
  calcularCuotaNivelada,
  generarPlanPagos,
  type Periodicidad,
} from '@simulacion-credito/shared';
import { aCentavos, desdeCentavos, desdePuntosBasicos } from '../../../core/domain/dinero';

export interface CuotaPlan {
  numero: number;
  fechaVencimiento: Date;
  cuotaCentavos: number;
  capitalCentavos: number;
  interesCentavos: number;
  /** Saldo después de pagar esta cuota; la última queda en 0. */
  saldoCentavos: number;
}

export interface DatosCredito {
  numeroCredito: string;
  solicitudId: number;
  montoCentavos: number;
  tasaAnualBps: number;
  periodicidad: Periodicidad;
  cantidadCuotas: number;
  cuotaNiveladaCentavos: number;
  fechaAprobacion: Date;
  cuotas: readonly CuotaPlan[];
}

/** Condiciones aprobadas que se copian de la solicitud al crédito. La cuota no: se calcula al otorgar. */
export interface CondicionesAprobadas {
  solicitudId: number;
  montoCentavos: number;
  tasaAnualBps: number;
  periodicidad: Periodicidad;
  cantidadCuotas: number;
}

// Contrato inmutable: la solicitud es la petición, el crédito es lo pactado.
export class Credito {
  readonly numeroCredito: string;
  readonly solicitudId: number;
  readonly montoCentavos: number;
  readonly tasaAnualBps: number;
  readonly periodicidad: Periodicidad;
  readonly cantidadCuotas: number;
  readonly cuotaNiveladaCentavos: number;
  readonly fechaAprobacion: Date;
  readonly cuotas: readonly CuotaPlan[];

  private constructor(datos: DatosCredito) {
    this.numeroCredito = datos.numeroCredito;
    this.solicitudId = datos.solicitudId;
    this.montoCentavos = datos.montoCentavos;
    this.tasaAnualBps = datos.tasaAnualBps;
    this.periodicidad = datos.periodicidad;
    this.cantidadCuotas = datos.cantidadCuotas;
    this.cuotaNiveladaCentavos = datos.cuotaNiveladaCentavos;
    this.fechaAprobacion = datos.fechaAprobacion;
    this.cuotas = datos.cuotas;
  }

  /**
   * Crea el crédito de una solicitud aprobada: calcula la cuota nivelada con
   * calcularCuotaNivelada y genera el plan completo (una cuota por período del plazo) con
   * generarPlanPagos, ambas de packages/shared, desde la fecha de aprobación.
   */
  static otorgar(
    condiciones: CondicionesAprobadas,
    numeroCredito: string,
    fechaAprobacion: Date,
  ): Credito {
    const monto = desdeCentavos(condiciones.montoCentavos);
    const tasaAnual = desdePuntosBasicos(condiciones.tasaAnualBps);
    const cuotaNivelada = calcularCuotaNivelada(
      monto,
      tasaAnual,
      condiciones.cantidadCuotas,
      condiciones.periodicidad,
    );
    const plan = generarPlanPagos({
      monto,
      tasaAnual,
      cuotas: condiciones.cantidadCuotas,
      periodicidad: condiciones.periodicidad,
      fechaInicio: fechaAprobacion,
    });

    return new Credito({
      ...condiciones,
      cuotaNiveladaCentavos: aCentavos(cuotaNivelada),
      numeroCredito,
      fechaAprobacion,
      cuotas: plan.map((fila) => ({
        numero: fila.numero,
        fechaVencimiento: fila.fechaVencimiento,
        cuotaCentavos: aCentavos(fila.cuota),
        capitalCentavos: aCentavos(fila.capital),
        interesCentavos: aCentavos(fila.interes),
        saldoCentavos: aCentavos(fila.saldo),
      })),
    });
  }
}
