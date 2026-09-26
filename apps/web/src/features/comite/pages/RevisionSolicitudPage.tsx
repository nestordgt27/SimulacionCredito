import { Link, Navigate, useParams } from 'react-router';
import { mensajeDeError } from '../../../shared/api/errores';
import { Alerta } from '../../../shared/ui/Alerta';
import { DictamenForm } from '../components/DictamenForm';
import { FichaSolicitud } from '../components/FichaSolicitud';
import { ResultadoDictamen } from '../components/ResultadoDictamen';
import { useAprobarSolicitud, useRechazarSolicitud, useSolicitudComite } from '../hooks/useComite';

export function RevisionSolicitudPage() {
  const id = Number(useParams().id);

  if (!Number.isInteger(id) || id <= 0) {
    return <Navigate to="/comite" replace />;
  }
  return <Revision id={id} />;
}

function Revision({ id }: { id: number }) {
  const solicitud = useSolicitudComite(id);
  const aprobar = useAprobarSolicitud(id);
  const rechazar = useRechazarSolicitud(id);
  const errorDictamen = aprobar.error ?? rechazar.error;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Revisión de la solicitud #{id}</h2>
        <Link to="/comite" className="text-sm font-medium text-teal-700 hover:text-teal-900">
          ← Volver a la bandeja
        </Link>
      </div>

      {solicitud.isPending && <p className="text-sm text-slate-500">Cargando solicitud…</p>}
      {solicitud.isError && (
        <Alerta>{mensajeDeError(solicitud.error, 'No se pudo cargar la solicitud')}</Alerta>
      )}
      {solicitud.isSuccess && <FichaSolicitud solicitud={solicitud.data} />}

      {aprobar.isSuccess && <ResultadoDictamen tipo="aprobada" resultado={aprobar.data} />}
      {rechazar.isSuccess && <ResultadoDictamen tipo="rechazada" resultado={rechazar.data} />}
      {solicitud.isSuccess && !aprobar.isSuccess && !rechazar.isSuccess && (
        <DictamenForm
          procesando={aprobar.isPending || rechazar.isPending}
          error={
            errorDictamen
              ? mensajeDeError(errorDictamen, 'No se pudo registrar el dictamen')
              : undefined
          }
          onAprobar={(observaciones) => {
            rechazar.reset();
            aprobar.mutate(observaciones);
          }}
          onRechazar={(observaciones) => {
            aprobar.reset();
            rechazar.mutate(observaciones);
          }}
        />
      )}
    </div>
  );
}
