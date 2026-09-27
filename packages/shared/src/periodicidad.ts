import { sumarDias, sumarMeses } from './fechas';

export const Periodicidad = {
  ANUAL: 'ANUAL',
  MENSUAL: 'MENSUAL',
  QUINCENAL: 'QUINCENAL',
} as const;

export type Periodicidad = (typeof Periodicidad)[keyof typeof Periodicidad];

export interface ConfiguracionPeriodicidad {
  /** Cantidad de pagos por año. */
  readonly n: number;
  /** Fecha que queda `periodos` periodos después de `fechaInicio`. */
  avanzarFecha(fechaInicio: Date, periodos: number): Date;
}

// Estrategia por periodicidad (CLAUDE.md §3, principio O): agregar una periodicidad nueva
// es agregar una entrada aquí, sin tocar los cálculos.
export const PERIODICIDADES: Readonly<Record<Periodicidad, ConfiguracionPeriodicidad>> = {
  [Periodicidad.ANUAL]: {
    n: 1,
    avanzarFecha: (fechaInicio, periodos) => sumarMeses(fechaInicio, 12 * periodos),
  },
  [Periodicidad.MENSUAL]: {
    n: 12,
    avanzarFecha: (fechaInicio, periodos) => sumarMeses(fechaInicio, periodos),
  },
  [Periodicidad.QUINCENAL]: {
    n: 24,
    avanzarFecha: (fechaInicio, periodos) => sumarDias(fechaInicio, 15 * periodos),
  },
};

// Protege contra valores que llegan sin tipar en tiempo de ejecución (HTTP, formularios).
export function obtenerConfiguracion(periodicidad: Periodicidad): ConfiguracionPeriodicidad {
  if (!Object.hasOwn(PERIODICIDADES, periodicidad)) {
    throw new RangeError(`Periodicidad no soportada: ${String(periodicidad)}`);
  }
  return PERIODICIDADES[periodicidad];
}
