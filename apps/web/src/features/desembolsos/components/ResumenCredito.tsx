import { ETIQUETAS_PERIODICIDAD } from '../../../shared/lib/etiquetas';
import { formatearMonto } from '../../../shared/lib/formato';
import { Tarjeta } from '../../../shared/ui/Tarjeta';
import type { SolicitudAprobada } from '../api/desembolsos.api';

export function ResumenCredito({ solicitud }: { solicitud: SolicitudAprobada }) {
  const { cliente, credito } = solicitud;
  const datos: [string, string][] = [
    ['Cliente', cliente.nombreCompleto],
    ['Cédula', cliente.cedula],
    ['Monto a desembolsar', formatearMonto(credito.monto)],
    ['Cuota nivelada', formatearMonto(credito.cuotaNivelada)],
    [
      'Cuotas',
      `${credito.cantidadCuotas} (${ETIQUETAS_PERIODICIDAD[credito.periodicidad].toLowerCase()})`,
    ],
  ];

  return (
    <Tarjeta>
      <h3 className="mb-4 text-base font-semibold text-slate-900">Crédito aprobado</h3>
      <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
        {datos.map(([termino, valor]) => (
          <div key={termino}>
            <dt className="text-slate-500">{termino}</dt>
            <dd className="font-medium text-slate-900">{valor}</dd>
          </div>
        ))}
      </dl>
      {solicitud.observaciones && (
        <p className="mt-4 text-sm text-slate-600">
          Observaciones del comité: {solicitud.observaciones}
        </p>
      )}
    </Tarjeta>
  );
}
