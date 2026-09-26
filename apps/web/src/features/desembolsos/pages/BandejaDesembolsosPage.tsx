import { useRef } from 'react';
import { mensajeDeError } from '../../../shared/api/errores';
import { ELEMENTOS_POR_PAGINA, paginar } from '../../../shared/lib/paginacion';
import { usePaginaEnUrl } from '../../../shared/lib/usePaginaEnUrl';
import { Alerta } from '../../../shared/ui/Alerta';
import { Paginacion } from '../../../shared/ui/Paginacion';
import { Tarjeta } from '../../../shared/ui/Tarjeta';
import type { SolicitudAprobada } from '../api/desembolsos.api';
import { TablaAprobadas } from '../components/TablaAprobadas';
import { useSolicitudesAprobadas } from '../hooks/useDesembolsos';

export function BandejaDesembolsosPage() {
  const aprobadas = useSolicitudesAprobadas();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Desembolsos</h2>
        <p className="text-sm text-slate-600">Créditos aprobados pendientes de desembolso.</p>
      </div>
      {aprobadas.isPending && <p className="text-sm text-slate-500">Cargando créditos…</p>}
      {aprobadas.isError && (
        <Alerta>{mensajeDeError(aprobadas.error, 'No se pudieron cargar los créditos')}</Alerta>
      )}
      {aprobadas.isSuccess &&
        (aprobadas.data.length === 0 ? (
          <Tarjeta>
            <p className="text-sm text-slate-600">No hay créditos pendientes de desembolso.</p>
          </Tarjeta>
        ) : (
          <ListadoPaginado solicitudes={aprobadas.data} />
        ))}
    </div>
  );
}

// Paginación en el cliente (misma regla que la consulta): 5 por página y controles solo
// cuando hay más de 5. La página vive en la URL (?pagina=N).
function ListadoPaginado({ solicitudes }: { solicitudes: SolicitudAprobada[] }) {
  const [pagina, irAPagina] = usePaginaEnUrl();
  const inicio = useRef<HTMLElement>(null);
  const actual = paginar(solicitudes, pagina, ELEMENTOS_POR_PAGINA);

  function cambiarPagina(nueva: number) {
    irAPagina(nueva);
    inicio.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  }

  return (
    <section
      ref={inicio}
      aria-label="Créditos por desembolsar"
      className="flex scroll-mt-4 flex-col gap-4"
    >
      {actual.totalPaginas > 1 && (
        <p className="text-sm text-slate-600" aria-live="polite">
          Mostrando {actual.desde}–{actual.hasta} de {actual.totalElementos} créditos
        </p>
      )}
      <TablaAprobadas solicitudes={actual.elementos} />
      {actual.totalPaginas > 1 && (
        <Paginacion
          etiqueta="Paginación de desembolsos"
          paginaActual={actual.paginaActual}
          totalPaginas={actual.totalPaginas}
          onCambiar={cambiarPagina}
        />
      )}
    </section>
  );
}
