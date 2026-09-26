import { useId } from 'react';
import { ETIQUETAS_PERIODICIDAD } from '../../../shared/lib/etiquetas';
import { formatearMeses, formatearMonto } from '../../../shared/lib/formato';
import { Tarjeta } from '../../../shared/ui/Tarjeta';
import type { SolicitudComite } from '../api/comite.api';

// Vista de solo lectura del comité: exactamente los 7 campos del enunciado (CLAUDE.md §4),
// agrupados en datos personales y datos del crédito. No hay datos laborales porque el
// enunciado limita la vista a esos 7 campos.
export function FichaSolicitud({ solicitud }: { solicitud: SolicitudComite }) {
  const personales: [string, string][] = [
    ['Cédula / Identificación', solicitud.cedula],
    ['Nombre Completo', solicitud.nombreCompleto],
    ['Edad', `${solicitud.edad} años`],
  ];
  const credito: [string, string][] = [
    ['Cantidad de cuotas', String(solicitud.cantidadCuotas)],
    ['Periodicidad de Pago', ETIQUETAS_PERIODICIDAD[solicitud.periodicidad]],
    ['Plazo', formatearMeses(solicitud.plazoMeses)],
    ['Monto solicitado', formatearMonto(solicitud.monto)],
  ];

  return (
    <Tarjeta>
      <h3 className="mb-4 text-base font-semibold text-slate-900">Datos de la solicitud</h3>
      <div className="flex flex-col gap-6">
        <GrupoDatos titulo="Datos personales" datos={personales} />
        <GrupoDatos titulo="Datos del crédito" datos={credito} />
      </div>
    </Tarjeta>
  );
}

function GrupoDatos({ titulo, datos }: { titulo: string; datos: [string, string][] }) {
  const idTitulo = useId();

  return (
    <div role="group" aria-labelledby={idTitulo}>
      <h4 id={idTitulo} className="mb-2 text-sm font-semibold text-slate-700">
        {titulo}
      </h4>
      <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        {datos.map(([termino, valor]) => (
          <div key={termino}>
            <dt className="text-slate-500">{termino}</dt>
            <dd className="font-medium text-slate-900">{valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
