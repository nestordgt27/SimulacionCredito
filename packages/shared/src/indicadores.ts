import Decimal from 'decimal.js';
import { calcularCuotaNivelada, redondearMoneda } from './cuota-nivelada';
import { obtenerConfiguracion, type Periodicidad } from './periodicidad';
import { generarPlanPagos } from './plan-pagos';

export interface ParametrosIndicadores {
  monto: number;
  tasaAnual: number;
  cuotas: number;
  periodicidad: Periodicidad;
  ingresoMensual: number;
}

export interface IndicadoresFinancieros {
  cuotaNivelada: number;
  /** Cuota llevada a un mes: cuota · n / 12. Permite comparar con el ingreso mensual. */
  cuotaMensualEquivalente: number;
  /** Porcentaje del ingreso mensual que se va en la cuota; null si el ingreso es 0. */
  relacionCuotaIngreso: number | null;
  /** Suma del plan completo (la última cuota ya viene ajustada por redondeo). */
  totalAPagar: number;
  totalIntereses: number;
}

// Fecha fija: los indicadores no dependen de los vencimientos, solo de los importes del plan.
const FECHA_REFERENCIA = new Date(0);

/**
 * Indicadores para evaluar la viabilidad de una solicitud (vista del comité). Son informativos:
 * no aplican ningún umbral de aprobación.
 */
export function calcularIndicadoresFinancieros({
  monto,
  tasaAnual,
  cuotas,
  periodicidad,
  ingresoMensual,
}: ParametrosIndicadores): IndicadoresFinancieros {
  if (!Number.isFinite(ingresoMensual) || ingresoMensual < 0) {
    throw new RangeError('El ingreso mensual debe ser un número mayor o igual que 0');
  }

  const plan = generarPlanPagos({
    monto,
    tasaAnual,
    cuotas,
    periodicidad,
    fechaInicio: FECHA_REFERENCIA,
  });
  const cuotaNivelada = new Decimal(calcularCuotaNivelada(monto, tasaAnual, cuotas, periodicidad));
  const totalAPagar = plan.reduce((total, fila) => total.plus(fila.cuota), new Decimal(0));
  const cuotaMensual = redondearMoneda(
    cuotaNivelada.times(obtenerConfiguracion(periodicidad).n).dividedBy(12),
  );

  return {
    cuotaNivelada: cuotaNivelada.toNumber(),
    cuotaMensualEquivalente: cuotaMensual.toNumber(),
    relacionCuotaIngreso:
      ingresoMensual === 0
        ? null
        : redondearMoneda(cuotaMensual.dividedBy(ingresoMensual).times(100)).toNumber(),
    totalAPagar: totalAPagar.toNumber(),
    totalIntereses: totalAPagar.minus(monto).toNumber(),
  };
}
