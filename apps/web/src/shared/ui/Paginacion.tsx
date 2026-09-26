interface PaginacionProps {
  paginaActual: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
  /** Nombre accesible de la navegación (ej. "Paginación de créditos"). */
  etiqueta: string;
}

// Anterior / números / Siguiente. La página actual se marca con aria-current="page".
export function Paginacion({ paginaActual, totalPaginas, onCambiar, etiqueta }: PaginacionProps) {
  const paginas = Array.from({ length: totalPaginas }, (_, indice) => indice + 1);
  const base =
    'min-w-9 rounded-md px-3 py-1.5 text-sm font-medium ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50';
  const normal = 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50';
  const actual = 'bg-teal-700 text-white ring-teal-700';

  return (
    <nav aria-label={etiqueta} className="flex flex-wrap items-center justify-center gap-1">
      <button
        type="button"
        className={`${base} ${normal}`}
        disabled={paginaActual === 1}
        onClick={() => onCambiar(paginaActual - 1)}
      >
        Anterior
      </button>
      {paginas.map((pagina) => (
        <button
          key={pagina}
          type="button"
          aria-label={`Página ${pagina}`}
          aria-current={pagina === paginaActual ? 'page' : undefined}
          className={`${base} ${pagina === paginaActual ? actual : normal}`}
          onClick={() => onCambiar(pagina)}
        >
          {pagina}
        </button>
      ))}
      <button
        type="button"
        className={`${base} ${normal}`}
        disabled={paginaActual === totalPaginas}
        onClick={() => onCambiar(paginaActual + 1)}
      >
        Siguiente
      </button>
    </nav>
  );
}
