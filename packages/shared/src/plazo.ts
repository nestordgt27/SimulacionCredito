import { obtenerConfiguracion, type Periodicidad } from './periodicidad';
import { validarCuotas } from './validaciones';

/** Plazo derivado en meses: cuotas · 12 / n. Puede ser fraccionario (3 cuotas quincenales = 1,5 meses). */
export function calcularPlazoMeses(cuotas: number, periodicidad: Periodicidad): number {
  validarCuotas(cuotas);
  return (cuotas * 12) / obtenerConfiguracion(periodicidad).n;
}
