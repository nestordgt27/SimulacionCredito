import { ETIQUETAS_PERIODICIDAD } from '../../../shared/lib/etiquetas';
import { formatearMeses, formatearMonto } from '../../../shared/lib/formato';
import { Tarjeta } from '../../../shared/ui/Tarjeta';
import type { SolicitudComite } from '../api/comite.api';

// Vista de solo lectura del comité: exactamente los 7 campos del enunciado (CLAUDE.md §4).
export function FichaSolicitud({ solicitud }: { solicitud: SolicitudComite }) {
  const datos: [string, string][] = [
    ['Cédula', solicitud.cedula],
    ['Nombre', solicitud.nombreCompleto],
    ['Edad', `${solicitud.edad} años`],
    ['Cuotas', String(solicitud.cantidadCuotas)],
    ['Periodicidad', ETIQUETAS_PERIODICIDAD[solicitud.periodicidad]],
    ['Plazo', formatearMeses(solicitud.plazoMeses)],
    ['Monto', formatearMonto(solicitud.monto)],
  ];

  return (
    <Tarjeta>
      <h3 className="mb-4 text-base font-semibold text-slate-900">Datos de la solicitud</h3>
      <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        {datos.map(([termino, valor]) => (
          <div key={termino}>
            <dt className="text-slate-500">{termino}</dt>
            <dd className="font-medium text-slate-900">{valor}</dd>
          </div>
        ))}
      </dl>
    </Tarjeta>
  );
}
