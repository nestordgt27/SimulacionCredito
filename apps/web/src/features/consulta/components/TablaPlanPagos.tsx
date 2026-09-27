import { formatearFecha, formatearMonto } from '../../../shared/lib/formato';
import { sumarMontos } from '../../../shared/lib/montos';
import type { CuotaPlanConsultada } from '../api/creditos.api';

interface TablaPlanPagosProps {
  numeroCredito: string;
  planPagos: CuotaPlanConsultada[];
}

export function TablaPlanPagos({ numeroCredito, planPagos }: TablaPlanPagosProps) {
  const totales = {
    cuota: sumarMontos(planPagos.map(({ cuota }) => cuota)),
    capital: sumarMontos(planPagos.map(({ capital }) => capital)),
    interes: sumarMontos(planPagos.map(({ interes }) => interes)),
  };
  const celda = 'px-3 py-2 text-right tabular-nums';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Plan de pagos del crédito {numeroCredito}</caption>
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              N.º
            </th>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Vencimiento
            </th>
            <th scope="col" className={`${celda} font-medium`}>
              Cuota
            </th>
            <th scope="col" className={`${celda} font-medium`}>
              Capital
            </th>
            <th scope="col" className={`${celda} font-medium`}>
              Interés
            </th>
            <th scope="col" className={`${celda} font-medium`}>
              Saldo
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {planPagos.map((fila) => (
            <tr key={fila.numero}>
              <td className="px-3 py-2">{fila.numero}</td>
              <td className="px-3 py-2">{formatearFecha(fila.fechaVencimiento)}</td>
              <td className={celda}>{formatearMonto(fila.cuota)}</td>
              <td className={celda}>{formatearMonto(fila.capital)}</td>
              <td className={celda}>{formatearMonto(fila.interes)}</td>
              <td className={celda}>{formatearMonto(fila.saldo)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-slate-200 font-medium text-slate-900">
          <tr>
            <th scope="row" colSpan={2} className="px-3 py-2 text-left">
              Totales
            </th>
            <td className={celda}>{formatearMonto(totales.cuota)}</td>
            <td className={celda}>{formatearMonto(totales.capital)}</td>
            <td className={celda}>{formatearMonto(totales.interes)}</td>
            <td className={celda} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
