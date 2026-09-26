import { Periodicidad, TipoEmpleo } from '@simulacion-credito/shared';

// Textos para mostrar los enums de packages/shared en la UI.

export const ETIQUETAS_PERIODICIDAD: Readonly<Record<Periodicidad, string>> = {
  [Periodicidad.MENSUAL]: 'Mensual',
  [Periodicidad.QUINCENAL]: 'Quincenal',
  [Periodicidad.ANUAL]: 'Anual',
};

export const ETIQUETAS_TIPO_EMPLEO: Readonly<Record<TipoEmpleo, string>> = {
  [TipoEmpleo.ASALARIADO]: 'Asalariado',
  [TipoEmpleo.INDEPENDIENTE]: 'Independiente',
};

/** Opciones para un Selector a partir de un mapa de etiquetas. */
export function opcionesDe<T extends string>(etiquetas: Readonly<Record<T, string>>) {
  return (Object.entries(etiquetas) as [T, string][]).map(([valor, etiqueta]) => ({
    valor,
    etiqueta,
  }));
}
