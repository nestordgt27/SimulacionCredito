import { Link } from 'react-router';
import { ETIQUETAS_PERIODICIDAD } from '../../../shared/lib/etiquetas';
import { formatearFecha, formatearMonto } from '../../../shared/lib/formato';
import type { SolicitudPendiente } from '../api/comite.api';

export function TablaPendientes({ solicitudes }: { solicitudes: SolicitudPendiente[] }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Solicitudes pendientes de revisión</caption>
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              N.º
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Cliente
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Cédula
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Monto
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Cuotas
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Registrada
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {solicitudes.map(({ id, creadaEn, cliente, credito }) => (
            <tr key={id}>
              <td className="px-4 py-3 text-slate-500">{id}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{cliente.nombreCompleto}</td>
              <td className="px-4 py-3">{cliente.cedula}</td>
              <td className="px-4 py-3 text-right">{formatearMonto(credito.monto)}</td>
              <td className="px-4 py-3">
                {credito.cantidadCuotas} (
                {ETIQUETAS_PERIODICIDAD[credito.periodicidad].toLowerCase()})
              </td>
              <td className="px-4 py-3">{formatearFecha(creadaEn)}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/comite/${id}`}
                  aria-label={`Revisar la solicitud ${id} de ${cliente.nombreCompleto}`}
                  className="font-medium text-teal-700 hover:text-teal-900"
                >
                  Revisar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
