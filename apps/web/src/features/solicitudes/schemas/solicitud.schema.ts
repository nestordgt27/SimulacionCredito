import {
  calcularEdad,
  EDAD_MAXIMA,
  FORMATO_CEDULA,
  LIMITES_SOLICITUD,
  Periodicidad,
  tieneMaximoDecimales,
  TipoEmpleo,
} from '@simulacion-credito/shared';
import { z } from 'zod';

// Validación temprana (UX). La regla real la aplica el backend, que además recalcula la cuota.
// Límites, formato de cédula y edad máxima vienen de packages/shared (CLAUDE.md §2.5).

const { MONTO_MAXIMO, TASA_ANUAL_MAXIMA, CUOTAS_MAXIMAS, ANTIGUEDAD_LABORAL_MAXIMA, DECIMALES } =
  LIMITES_SOLICITUD;

const conDecimales = (numero: number) => tieneMaximoDecimales(numero, DECIMALES);

/** "1990-01-01" → Date a las 00:00 UTC, igual que en el backend. */
export function aFechaUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function esFechaReal(iso: string): boolean {
  const fecha = aFechaUtc(iso);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().startsWith(iso);
}

/** Edad a la fecha de referencia, o null si la fecha no es válida o es futura. */
export function edadSegunFecha(iso: string, hoy: Date): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !esFechaReal(iso)) {
    return null;
  }
  const nacimiento = aFechaUtc(iso);
  return nacimiento > hoy ? null : calcularEdad(nacimiento, hoy);
}

const monto = (campo: string) =>
  z
    .number({ error: `Ingresa ${campo}` })
    .max(MONTO_MAXIMO, `El máximo es ${MONTO_MAXIMO.toLocaleString('es-NI')}`)
    .refine(conDecimales, `Usa como máximo ${DECIMALES} decimales`);

export const creditoSchema = z.object({
  monto: monto('el monto').positive('El monto debe ser mayor que 0'),
  tasaAnual: z
    .number({ error: 'Ingresa la tasa anual' })
    .min(0, 'La tasa no puede ser negativa')
    .max(TASA_ANUAL_MAXIMA, `La tasa máxima es ${TASA_ANUAL_MAXIMA} %`)
    .refine(conDecimales, `Usa como máximo ${DECIMALES} decimales`),
  cantidadCuotas: z
    .number({ error: 'Ingresa la cantidad de cuotas' })
    .int('La cantidad de cuotas debe ser un número entero')
    .min(1, 'Debe haber al menos 1 cuota')
    .max(CUOTAS_MAXIMAS, `El máximo es ${CUOTAS_MAXIMAS} cuotas`),
  periodicidad: z.enum(Periodicidad, { error: 'Selecciona la periodicidad' }),
});

export function crearSolicitudSchema(hoy: Date) {
  return z.object({
    cliente: z.object({
      cedula: z
        .string()
        .trim()
        .toUpperCase()
        .regex(FORMATO_CEDULA, 'La cédula debe tener el formato 000-000000-0000X'),
      nombreCompleto: z
        .string()
        .trim()
        .min(1, 'Ingresa el nombre completo')
        .max(150, 'Máximo 150 caracteres'),
      correo: z.string().trim().toLowerCase().pipe(z.email('Ingresa un correo válido')),
      telefono: z
        .string()
        .trim()
        .regex(/^\+?\d{8,15}$/, 'El teléfono debe tener entre 8 y 15 dígitos'),
      fechaNacimiento: z
        .string()
        .min(1, 'Ingresa la fecha de nacimiento')
        .superRefine((iso, contexto) => {
          // Zod ejecuta el refinamiento aunque falle min(1): sin esto habría dos mensajes.
          if (iso === '') {
            return;
          }
          if (!esFechaReal(iso)) {
            contexto.addIssue({ code: 'custom', message: 'Ingresa una fecha válida' });
            return;
          }
          const edad = edadSegunFecha(iso, hoy);
          if (edad === null) {
            contexto.addIssue({ code: 'custom', message: 'La fecha no puede ser futura' });
          } else if (edad > EDAD_MAXIMA) {
            contexto.addIssue({
              code: 'custom',
              message: `El cliente tiene ${edad} años; la edad máxima es ${EDAD_MAXIMA}`,
            });
          }
        }),
    }),
    empleo: z.object({
      tipoEmpleo: z.enum(TipoEmpleo, { error: 'Selecciona el tipo de empleo' }),
      empresa: z
        .string()
        .trim()
        .min(1, 'Ingresa la empresa o negocio')
        .max(150, 'Máximo 150 caracteres'),
      antiguedadLaboralAnios: z
        .number({ error: 'Ingresa la antigüedad' })
        .int('Usa años completos')
        .min(0, 'La antigüedad no puede ser negativa')
        .max(ANTIGUEDAD_LABORAL_MAXIMA, `El máximo es ${ANTIGUEDAD_LABORAL_MAXIMA} años`),
      ingresoMensual: monto('el ingreso mensual').min(0, 'El ingreso no puede ser negativo'),
    }),
    credito: creditoSchema,
  });
}

export type SolicitudFormulario = z.input<ReturnType<typeof crearSolicitudSchema>>;
export type SolicitudValida = z.output<ReturnType<typeof crearSolicitudSchema>>;
export type CondicionesCredito = z.output<typeof creditoSchema>;
