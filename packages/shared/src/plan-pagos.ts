import Decimal from 'decimal.js';
import { calcularCuotaNivelada, calcularTasaPeriodica, redondearMoneda } from './cuota-nivelada';
import { obtenerConfiguracion, type Periodicidad } from './periodicidad';
import { validarFecha, validarParametrosCredito } from './validaciones';

export interface ParametrosPlanPagos {
  monto: number;
  tasaAnual: number;
  cuotas: number;
  periodicidad: Periodicidad;
  /** Fecha desde la que se cuentan los vencimientos (fecha de aprobación). */
  fechaInicio: Date;
}

export interface CuotaPlan {
  numero: number;
  fechaVencimiento: Date;
  cuota: number;
  interes: number;
  capital: number;
  /** Saldo pendiente después de pagar esta cuota. */
  saldo: number;
}

/**
 * Plan de amortización con cuota nivelada. El interés de cada periodo se redondea a 2 decimales.
 * La última cuota paga todo el saldo restante, así el residuo del redondeo se absorbe ahí
 * y el saldo final es exactamente 0.
 */
export function generarPlanPagos({
  monto,
  tasaAnual,
  cuotas,
  periodicidad,
  fechaInicio,
}: ParametrosPlanPagos): CuotaPlan[] {
  validarParametrosCredito({ monto, tasaAnual, cuotas });
  validarFecha(fechaInicio, 'La fecha de inicio');

  const { avanzarFecha } = obtenerConfiguracion(periodicidad);
  const i = calcularTasaPeriodica(tasaAnual, periodicidad);
  const cuotaNivelada = new Decimal(calcularCuotaNivelada(monto, tasaAnual, cuotas, periodicidad));

  const plan: CuotaPlan[] = [];
  let saldo = new Decimal(monto);

  for (let numero = 1; numero <= cuotas; numero++) {
    const interes = redondearMoneda(saldo.times(i));
    const capital = numero === cuotas ? saldo : cuotaNivelada.minus(interes);
    saldo = saldo.minus(capital);

    plan.push({
      numero,
      fechaVencimiento: avanzarFecha(fechaInicio, numero),
      cuota: capital.plus(interes).toNumber(),
      interes: interes.toNumber(),
      capital: capital.toNumber(),
      saldo: saldo.toNumber(),
    });
  }

  return plan;
}
