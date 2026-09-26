import Decimal from 'decimal.js';

// Límites de captura de una solicitud (CLAUDE.md §4). Los usan el DTO de la API (regla real)
// y el formulario de la web (validación temprana), para que no diverjan.
export const LIMITES_SOLICITUD = {
  /** Máximo que cabe en un Int de 32 bits expresado en centavos. */
  MONTO_MAXIMO: 21_474_836.47,
  TASA_ANUAL_MAXIMA: 100,
  CUOTAS_MAXIMAS: 360,
  ANTIGUEDAD_LABORAL_MAXIMA: 80,
  /** Decimales permitidos en montos y tasa. */
  DECIMALES: 2,
} as const;

/** Cédula nicaragüense normalizada: 000-000000-0000X. */
export const FORMATO_CEDULA = /^\d{3}-\d{6}-\d{4}[A-Z]$/;

/** Número de cuenta bancaria para el desembolso: solo dígitos, de 6 a 20 (texto: conserva ceros). */
export const FORMATO_NUMERO_CUENTA = /^\d{6,20}$/;

export function tieneMaximoDecimales(valor: number, decimales: number): boolean {
  return Number.isFinite(valor) && new Decimal(valor).decimalPlaces() <= decimales;
}
