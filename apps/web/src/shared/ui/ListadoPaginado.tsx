import { useRef, type ReactNode } from 'react';
import { ELEMENTOS_POR_PAGINA, paginar } from '../lib/paginacion';
import { usePaginaEnUrl } from '../lib/usePaginaEnUrl';
import { Paginacion } from './Paginacion';

interface ListadoPaginadoProps<T> {
  elementos: readonly T[];
  /** Sustantivo en plural para el resumen: "Mostrando 1–5 de 7 {unidad}". */
  unidad: string;
  /** Nombre accesible de la región del listado. */
  etiquetaRegion: string;
  /** Nombre accesible de la navegación de páginas. */
  etiquetaNavegacion: string;
  /** Texto del resumen cuando cabe todo en una página; sin él no se muestra resumen. */
  resumenSinPaginas?: (total: number) => string;
  /** Cómo mostrar los elementos de la página actual (tabla, tarjetas…). */
  children: (enPagina: T[]) => ReactNode;
}

/**
 * Listado paginado en el cliente, con la página en la URL (?pagina=N). Los controles y el
 * resumen "Mostrando X–Y de N" aparecen solo cuando hay más de ELEMENTOS_POR_PAGINA elementos.
 * Lo usan la consulta de créditos, la bandeja del comité y la de desembolsos.
 */
export function ListadoPaginado<T>({
  elementos,
  unidad,
  etiquetaRegion,
  etiquetaNavegacion,
  resumenSinPaginas,
  children,
}: ListadoPaginadoProps<T>) {
  const [pagina, irAPagina] = usePaginaEnUrl();
  const inicio = useRef<HTMLElement>(null);
  const actual = paginar(elementos, pagina, ELEMENTOS_POR_PAGINA);
  const hayVariasPaginas = actual.totalPaginas > 1;
  const resumen = hayVariasPaginas
    ? `Mostrando ${actual.desde}–${actual.hasta} de ${actual.totalElementos} ${unidad}`
    : resumenSinPaginas?.(actual.totalElementos);

  function cambiarPagina(nueva: number) {
    irAPagina(nueva);
    // Los controles están al final del listado: se vuelve a su inicio.
    inicio.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  }

  return (
    <section ref={inicio} aria-label={etiquetaRegion} className="flex scroll-mt-4 flex-col gap-4">
      {resumen && (
        <p className="text-sm text-slate-600" aria-live="polite">
          {resumen}
        </p>
      )}
      {children(actual.elementos)}
      {hayVariasPaginas && (
        <Paginacion
          etiqueta={etiquetaNavegacion}
          paginaActual={actual.paginaActual}
          totalPaginas={actual.totalPaginas}
          onCambiar={cambiarPagina}
        />
      )}
    </section>
  );
}
