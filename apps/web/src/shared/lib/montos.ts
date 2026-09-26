/**
 * Suma montos de 2 decimales en centavos enteros, para no acumular errores de punto flotante
 * (0.1 + 0.2 = 0.30000000000000004). Mismo criterio que la persistencia del backend.
 */
export function sumarMontos(montos: readonly number[]): number {
  const centavos = montos.reduce((total, monto) => total + Math.round(monto * 100), 0);
  return centavos / 100;
}
