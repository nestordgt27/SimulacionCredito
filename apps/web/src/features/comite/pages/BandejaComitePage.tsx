import { mensajeDeError } from '../../../shared/api/errores';
import { Alerta } from '../../../shared/ui/Alerta';
import { ListadoPaginado } from '../../../shared/ui/ListadoPaginado';
import { Tarjeta } from '../../../shared/ui/Tarjeta';
import { TablaPendientes } from '../components/TablaPendientes';
import { useSolicitudesPendientes } from '../hooks/useComite';

export function BandejaComitePage() {
  const pendientes = useSolicitudesPendientes();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Comité de crédito</h2>
        <p className="text-sm text-slate-600">Solicitudes pendientes de revisión.</p>
      </div>
      {pendientes.isPending && <p className="text-sm text-slate-500">Cargando solicitudes…</p>}
      {pendientes.isError && (
        <Alerta>{mensajeDeError(pendientes.error, 'No se pudieron cargar las solicitudes')}</Alerta>
      )}
      {pendientes.isSuccess &&
        (pendientes.data.length === 0 ? (
          <Tarjeta>
            <p className="text-sm text-slate-600">No hay solicitudes pendientes de revisión.</p>
          </Tarjeta>
        ) : (
          <ListadoPaginado
            elementos={pendientes.data}
            unidad="solicitudes"
            etiquetaRegion="Solicitudes pendientes"
            etiquetaNavegacion="Paginación de solicitudes"
          >
            {(enPagina) => <TablaPendientes solicitudes={enPagina} />}
          </ListadoPaginado>
        ))}
    </div>
  );
}
