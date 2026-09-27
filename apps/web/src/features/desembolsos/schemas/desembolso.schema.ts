import { Banco, FORMATO_NUMERO_CUENTA } from '@simulacion-credito/shared';
import { z } from 'zod';

// Mismas reglas que el DTO del backend (formato de cuenta compartido en packages/shared).
export const desembolsoSchema = z.object({
  banco: z.enum(Banco, { error: 'Selecciona el banco' }),
  numeroCuenta: z
    .string()
    .trim()
    .regex(FORMATO_NUMERO_CUENTA, 'El número de cuenta debe tener entre 6 y 20 dígitos'),
});

export type DatosBancariosFormulario = z.input<typeof desembolsoSchema>;
export type DatosBancarios = z.output<typeof desembolsoSchema>;
