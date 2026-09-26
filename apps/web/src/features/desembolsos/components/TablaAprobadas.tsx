import { Link } from 'react-router';
import { ETIQUETAS_PERIODICIDAD } from '../../../shared/lib/etiquetas';
import { formatearMonto, formatearPorcentaje } from '../../../shared/lib/formato';
import type { SolicitudAprobada } from '../api/desembolsos.api';

// Columnas por prioridad: siempre Cliente, Monto (con la tasa debajo) y la acción; desde sm
// N.º y Tasa anual; desde md Cuota y Cuotas; desde lg Cédula (docs/ARCHITECTURE.md).
export function TablaAprobadas({ solicitudes }: { solicitudes: SolicitudAprobada[] }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Solicitudes aprobadas pendientes de desembolso</caption>
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th scope="col" className="hidden sm:table-cell px-3 py-3 sm:px-4 font-medium">
              N.º
            </th>
            <th scope="col" className="px-3 py-3 sm:px-4 font-medium">
              Cliente
            </th>
            <th scope="col" className="hidden lg:table-cell px-3 py-3 sm:px-4 font-medium">
              Cédula
            </th>
            <th scope="col" className="px-3 py-3 sm:px-4 text-right font-medium">
              Monto
            </th>
            <th
              scope="col"
              className="hidden sm:table-cell px-3 py-3 sm:px-4 text-right font-medium whitespace-nowrap"
            >
              Tasa anual
            </th>
            <th
              scope="col"
              className="hidden md:table-cell px-3 py-3 sm:px-4 text-right font-medium"
            >
              Cuota
            </th>
            <th scope="col" className="hidden md:table-cell px-3 py-3 sm:px-4 font-medium">
              Cuotas
            </th>
            <th scope="col" className="px-3 py-3 sm:px-4">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {solicitudes.map(({ id, cliente, credito }) => (
            <tr key={id}>
              <td className="hidden sm:table-cell px-3 py-3 sm:px-4 text-slate-500">{id}</td>
              <td className="px-3 py-3 sm:px-4 font-medium text-slate-900">
                {cliente.nombreCompleto}
              </td>
              <td className="hidden lg:table-cell px-3 py-3 sm:px-4">{cliente.cedula}</td>
              <td className="px-3 py-3 sm:px-4 text-right whitespace-nowrap">
                {formatearMonto(credito.monto)}
                {/* En pantallas angostas la columna de la tasa se oculta: se muestra aquí. */}
                <span className="block text-xs text-slate-500 sm:hidden">
                  Tasa anual: {formatearPorcentaje(credito.tasaAnual)}
                </span>
              </td>
              <td className="hidden sm:table-cell px-3 py-3 sm:px-4 text-right whitespace-nowrap">
                {formatearPorcentaje(credito.tasaAnual)}
              </td>
              <td className="hidden md:table-cell px-3 py-3 sm:px-4 text-right whitespace-nowrap">
                {formatearMonto(credito.cuotaNivelada)}
              </td>
              <td className="hidden md:table-cell px-3 py-3 sm:px-4">
                {credito.cantidadCuotas} (
                {ETIQUETAS_PERIODICIDAD[credito.periodicidad].toLowerCase()})
              </td>
              <td className="px-3 py-3 sm:px-4 text-right">
                <Link
                  to={`/desembolsos/${id}`}
                  aria-label={`Desembolsar la solicitud ${id} de ${cliente.nombreCompleto}`}
                  className="font-medium text-teal-700 hover:text-teal-900"
                >
                  Desembolsar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
