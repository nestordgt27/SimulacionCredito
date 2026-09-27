import { mensajeDeError } from '../../../shared/api/errores';
import { Alerta } from '../../../shared/ui/Alerta';
import { ListadoPaginado } from '../../../shared/ui/ListadoPaginado';
import { Tarjeta } from '../../../shared/ui/Tarjeta';
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
          <ListadoPaginado
            elementos={aprobadas.data}
            unidad="créditos"
            etiquetaRegion="Créditos por desembolsar"
            etiquetaNavegacion="Paginación de desembolsos"
          >
            {(enPagina) => <TablaAprobadas solicitudes={enPagina} />}
          </ListadoPaginado>
        ))}
    </div>
  );
}
