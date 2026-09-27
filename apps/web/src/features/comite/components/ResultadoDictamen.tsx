import { Link } from 'react-router';
import { ETIQUETAS_PERIODICIDAD } from '../../../shared/lib/etiquetas';
import { formatearMonto } from '../../../shared/lib/formato';
import { Tarjeta } from '../../../shared/ui/Tarjeta';
import type { ResultadoAprobacion, ResultadoRechazo } from '../api/comite.api';

type ResultadoDictamenProps =
  | { tipo: 'aprobada'; resultado: ResultadoAprobacion }
  | { tipo: 'rechazada'; resultado: ResultadoRechazo };

export function ResultadoDictamen(props: ResultadoDictamenProps) {
  const { solicitudId, observaciones } = props.resultado;

  return (
    <Tarjeta>
      <div role="status">
        <h3 className="text-lg font-semibold text-slate-900">
          Solicitud #{solicitudId} {props.tipo}
        </h3>
        {observaciones && (
          <p className="mt-1 text-sm text-slate-600">Observaciones: {observaciones}</p>
        )}
      </div>
      {props.tipo === 'aprobada' && (
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <dt className="text-slate-500">Número de crédito</dt>
            <dd className="font-semibold text-teal-800">{props.resultado.credito.numeroCredito}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Monto</dt>
            <dd className="font-medium">{formatearMonto(props.resultado.credito.monto)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Cuota nivelada</dt>
            <dd className="font-medium">{formatearMonto(props.resultado.credito.cuotaNivelada)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Cuotas</dt>
            <dd className="font-medium">
              {props.resultado.credito.cantidadCuotas} (
              {ETIQUETAS_PERIODICIDAD[props.resultado.credito.periodicidad].toLowerCase()})
            </dd>
          </div>
        </dl>
      )}
      <Link
        to="/comite"
        className="mt-6 inline-flex rounded-md px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
      >
        Volver a la bandeja
      </Link>
    </Tarjeta>
  );
}
