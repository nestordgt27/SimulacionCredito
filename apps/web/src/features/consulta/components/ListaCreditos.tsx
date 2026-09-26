import { useRef } from 'react';
import { ELEMENTOS_POR_PAGINA, paginar } from '../../../shared/lib/paginacion';
import { Paginacion } from '../../../shared/ui/Paginacion';
import type { CreditoConsultado } from '../api/creditos.api';
import { TarjetaCredito } from './TarjetaCredito';

interface ListaCreditosProps {
  creditos: CreditoConsultado[];
  pagina: number;
  onCambiarPagina: (pagina: number) => void;
}

function resumen({ desde, hasta, totalElementos, totalPaginas }: ReturnType<typeof paginar>) {
  if (totalPaginas > 1) {
    return `Mostrando ${desde}–${hasta} de ${totalElementos} créditos`;
  }
  return totalElementos === 1 ? '1 crédito encontrado' : `${totalElementos} créditos encontrados`;
}

// Paginación en el cliente: la API devuelve todos los créditos de un solo cliente (pocos).
// Los controles solo aparecen cuando hay más de ELEMENTOS_POR_PAGINA.
export function ListaCreditos({ creditos, pagina, onCambiarPagina }: ListaCreditosProps) {
  const inicioResultados = useRef<HTMLElement>(null);
  const actual = paginar(creditos, pagina, ELEMENTOS_POR_PAGINA);

  function cambiarPagina(nueva: number) {
    onCambiarPagina(nueva);
    // Los controles están al final de la lista: se vuelve al inicio de los resultados.
    inicioResultados.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  }

  return (
    <section
      ref={inicioResultados}
      aria-label="Resultados"
      className="flex scroll-mt-4 flex-col gap-4"
    >
      <p className="text-sm text-slate-600" aria-live="polite">
        {resumen(actual)}
      </p>
      {actual.elementos.map((credito) => (
        <TarjetaCredito key={credito.numeroCredito} credito={credito} />
      ))}
      {actual.totalPaginas > 1 && (
        <Paginacion
          etiqueta="Paginación de créditos"
          paginaActual={actual.paginaActual}
          totalPaginas={actual.totalPaginas}
          onCambiar={cambiarPagina}
        />
      )}
    </section>
  );
}
