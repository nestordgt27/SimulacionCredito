import { Link, Navigate, useParams } from 'react-router';
import { mensajeDeError } from '../../../shared/api/errores';
import { Alerta } from '../../../shared/ui/Alerta';
import { DesembolsoForm } from '../components/DesembolsoForm';
import { ResultadoDesembolso } from '../components/ResultadoDesembolso';
import { ResumenCredito } from '../components/ResumenCredito';
import { useDesembolsar, useSolicitudesAprobadas } from '../hooks/useDesembolsos';

export function DesembolsarPage() {
  const solicitudId = Number(useParams().solicitudId);

  if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
    return <Navigate to="/desembolsos" replace />;
  }
  return <Desembolso solicitudId={solicitudId} />;
}

function Desembolso({ solicitudId }: { solicitudId: number }) {
  // El resumen sale de la lista de aprobadas (ya en caché si se llega desde la bandeja).
  const aprobadas = useSolicitudesAprobadas();
  const desembolsar = useDesembolsar(solicitudId);
  const solicitud = aprobadas.data?.find(({ id }) => id === solicitudId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold text-slate-900">
          Desembolso de la solicitud #{solicitudId}
        </h2>
        <Link to="/desembolsos" className="text-sm font-medium text-teal-700 hover:text-teal-900">
          ← Volver a los desembolsos
        </Link>
      </div>

      {desembolsar.isSuccess ? (
        <ResultadoDesembolso resultado={desembolsar.data} />
      ) : (
        <>
          {aprobadas.isPending && <p className="text-sm text-slate-500">Cargando crédito…</p>}
          {aprobadas.isError && (
            <Alerta>{mensajeDeError(aprobadas.error, 'No se pudo cargar el crédito')}</Alerta>
          )}
          {aprobadas.isSuccess && !solicitud && (
            <Alerta>La solicitud #{solicitudId} no está aprobada o ya fue desembolsada.</Alerta>
          )}
          {solicitud && (
            <>
              <ResumenCredito solicitud={solicitud} />
              <DesembolsoForm
                monto={solicitud.credito.monto}
                nombreCliente={solicitud.cliente.nombreCompleto}
                procesando={desembolsar.isPending}
                error={
                  desembolsar.isError
                    ? mensajeDeError(desembolsar.error, 'No se pudo registrar el desembolso')
                    : undefined
                }
                onConfirmar={(datos) => desembolsar.mutate(datos)}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
