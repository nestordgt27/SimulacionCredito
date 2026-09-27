import { ETIQUETAS_PERIODICIDAD } from '../../../shared/lib/etiquetas';
import { formatearMeses, formatearMonto, formatearPorcentaje } from '../../../shared/lib/formato';
import { Tarjeta } from '../../../shared/ui/Tarjeta';
import type { SolicitudAprobada } from '../api/desembolsos.api';

// Pantalla limpia del desembolso: únicamente los campos que pide el enunciado
// (cédula, nombre completo, monto, tasa, periodicidad y plazo).
export function ResumenCredito({ solicitud }: { solicitud: SolicitudAprobada }) {
  const { cliente, credito } = solicitud;
  const datos: [string, string][] = [
    ['Cédula', cliente.cedula],
    ['Nombre Completo', cliente.nombreCompleto],
    ['Monto', formatearMonto(credito.monto)],
    ['Tasa anual', formatearPorcentaje(credito.tasaAnual)],
    ['Periodicidad', ETIQUETAS_PERIODICIDAD[credito.periodicidad]],
    ['Plazo', formatearMeses(credito.plazoMeses)],
  ];

  return (
    <Tarjeta>
      <h3 className="mb-4 text-base font-semibold text-slate-900">Crédito aprobado</h3>
      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
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
