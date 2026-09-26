import { formatearMeses, formatearMonto } from '../../../shared/lib/formato';
import { Boton } from '../../../shared/ui/Boton';
import { Tarjeta } from '../../../shared/ui/Tarjeta';
import type { SolicitudRegistrada } from '../api/solicitudes.api';

interface ResultadoSolicitudProps {
  solicitud: SolicitudRegistrada;
  onNueva: () => void;
}

// Muestra los valores confirmados por el servidor (la cuota del backend, no la estimada).
export function ResultadoSolicitud({ solicitud, onNueva }: ResultadoSolicitudProps) {
  const { credito, cliente } = solicitud;

  return (
    <Tarjeta>
      <div role="status">
        <h2 className="text-lg font-semibold text-slate-900">
          Solicitud #{solicitud.id} registrada
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {cliente.nombreCompleto} ({cliente.cedula}) · Estado: {solicitud.estado}
        </p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <div>
          <dt className="text-slate-500">Monto</dt>
          <dd className="font-medium">{formatearMonto(credito.monto)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Cuota nivelada</dt>
          <dd className="font-medium">{formatearMonto(credito.cuotaNivelada)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Cuotas</dt>
          <dd className="font-medium">
            {credito.cantidadCuotas} ({credito.periodicidad.toLowerCase()})
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Plazo</dt>
          <dd className="font-medium">{formatearMeses(credito.plazoMeses)}</dd>
        </div>
      </dl>
      <div className="mt-6">
        <Boton variante="secundario" onClick={onNueva}>
          Registrar otra solicitud
        </Boton>
      </div>
    </Tarjeta>
  );
}
