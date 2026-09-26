export interface Pagina<T> {
  elementos: T[];
  /** Página mostrada, ya ajustada al rango válido (1..totalPaginas). */
  paginaActual: number;
  totalPaginas: number;
  totalElementos: number;
  /** Posición (1-based) del primer y el último elemento mostrados; 0 si no hay elementos. */
  desde: number;
  hasta: number;
}

/** Interpreta el parámetro de URL `pagina`: entero mayor o igual que 1, o 1 si no es válido. */
export function leerPagina(valor: string | null): number {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 1 ? numero : 1;
}

/**
 * Devuelve la porción de `elementos` de la página pedida. Una página fuera de rango
 * (por ejemplo, de una URL vieja o manipulada) se ajusta a la última o a la primera.
 */
export function paginar<T>(elementos: readonly T[], pagina: number, porPagina: number): Pagina<T> {
  const totalElementos = elementos.length;
  const totalPaginas = Math.max(1, Math.ceil(totalElementos / porPagina));
  const paginaActual = Math.min(Math.max(1, Math.trunc(pagina)), totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const enPagina = elementos.slice(inicio, inicio + porPagina);

  return {
    elementos: enPagina,
    paginaActual,
    totalPaginas,
    totalElementos,
    desde: totalElementos === 0 ? 0 : inicio + 1,
    hasta: inicio + enPagina.length,
  };
}
