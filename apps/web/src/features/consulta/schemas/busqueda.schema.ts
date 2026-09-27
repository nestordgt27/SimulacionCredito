import { FORMATO_CEDULA } from '@simulacion-credito/shared';
import { z } from 'zod';

// Misma normalización y formato que al registrar la solicitud y que el backend.
export const cedulaSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(FORMATO_CEDULA, 'La cédula debe tener el formato 000-000000-0000X');

export const busquedaSchema = z.object({ cedula: cedulaSchema });

export type BusquedaFormulario = z.input<typeof busquedaSchema>;
export type Busqueda = z.output<typeof busquedaSchema>;

/** Cédula válida y normalizada, o null (por ejemplo, un parámetro de URL manipulado). */
export function cedulaValida(valor: string | null): string | null {
  const resultado = cedulaSchema.safeParse(valor ?? '');
  return resultado.success ? resultado.data : null;
}
