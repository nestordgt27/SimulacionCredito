// Frontera entre unidades (API y packages/shared) y enteros persistidos (CLAUDE.md §3.1).
// Las entradas ya llegan validadas con máximo 2 decimales, así que Math.round solo
// absorbe el error de punto flotante (0.29 * 100 = 28.999999999999996).

/** 15000.5 → 1500050 */
export function aCentavos(monto: number): number {
  return Math.round(monto * 100);
}

/** 1500050 → 15000.5 */
export function desdeCentavos(centavos: number): number {
  return centavos / 100;
}

/** 18.5 % → 1850 puntos básicos */
export function aPuntosBasicos(tasaPorcentual: number): number {
  return Math.round(tasaPorcentual * 100);
}

/** 1850 puntos básicos → 18.5 % */
export function desdePuntosBasicos(puntosBasicos: number): number {
  return puntosBasicos / 100;
}
