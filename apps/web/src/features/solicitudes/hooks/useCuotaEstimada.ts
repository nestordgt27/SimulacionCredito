import { calcularCuotaNivelada, calcularPlazoMeses } from '@simulacion-credito/shared';
import { useMemo } from 'react';
import { creditoSchema } from '../schemas/solicitud.schema';

export interface CuotaEstimada {
  cuotaNivelada: number;
  plazoMeses: number;
}

/**
 * Cuota nivelada y plazo calculados en vivo con packages/shared (las mismas funciones que usa el
 * backend). Es informativa: el servidor la recalcula al registrar. Devuelve null mientras las
 * condiciones del crédito estén incompletas o sean inválidas.
 */
export function useCuotaEstimada(condiciones: unknown): CuotaEstimada | null {
  // Se serializa para que el memo dependa de los valores y no de la identidad del objeto.
  const clave = JSON.stringify(condiciones);

  return useMemo(() => {
    const resultado = creditoSchema.safeParse(JSON.parse(clave));
    if (!resultado.success) {
      return null;
    }
    const { monto, tasaAnual, cantidadCuotas, periodicidad } = resultado.data;
    return {
      cuotaNivelada: calcularCuotaNivelada(monto, tasaAnual, cantidadCuotas, periodicidad),
      plazoMeses: calcularPlazoMeses(cantidadCuotas, periodicidad),
    };
  }, [clave]);
}
