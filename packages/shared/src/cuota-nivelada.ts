import Decimal from 'decimal.js';
import { obtenerConfiguracion, type Periodicidad } from './periodicidad';
import { validarParametrosCredito } from './validaciones';

export function redondearMoneda(valor: Decimal): Decimal {
  return valor.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** i = (tasaAnual / 100) / n */
export function calcularTasaPeriodica(tasaAnual: number, periodicidad: Periodicidad): Decimal {
  return new Decimal(tasaAnual).dividedBy(100).dividedBy(obtenerConfiguracion(periodicidad).n);
}

/**
 * Cuota nivelada: M · [i(1+i)^c] / [(1+i)^c − 1], o M / c si la tasa es 0.
 * Se redondea a 2 decimales (ROUND_HALF_UP).
 */
export function calcularCuotaNivelada(
  monto: number,
  tasaAnual: number,
  cuotas: number,
  periodicidad: Periodicidad,
): number {
  validarParametrosCredito({ monto, tasaAnual, cuotas });

  const capital = new Decimal(monto);
  const i = calcularTasaPeriodica(tasaAnual, periodicidad);

  if (i.isZero()) {
    return redondearMoneda(capital.dividedBy(cuotas)).toNumber();
  }

  const factor = i.plus(1).pow(cuotas);
  const cuota = capital.times(i).times(factor).dividedBy(factor.minus(1));

  return redondearMoneda(cuota).toNumber();
}
