import { z } from 'zod';

// Mismas reglas que el backend: aprobar exige observaciones; rechazar las deja opcionales.
const LONGITUD_MAXIMA = 1000;
const observacionesBase = z
  .string()
  .trim()
  .max(LONGITUD_MAXIMA, `Máximo ${LONGITUD_MAXIMA} caracteres`);

export const aprobacionSchema = z.object({
  observaciones: observacionesBase.min(1, 'Las observaciones son obligatorias para aprobar'),
});

export const rechazoSchema = z.object({
  observaciones: observacionesBase.transform((texto) => texto || undefined),
});

export interface DictamenFormulario {
  observaciones: string;
}
