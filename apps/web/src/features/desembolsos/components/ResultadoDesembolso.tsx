import { Link } from 'react-router';
import { ETIQUETAS_BANCO } from '../../../shared/lib/etiquetas';
import { formatearFecha, formatearMonto } from '../../../shared/lib/formato';
import { Tarjeta } from '../../../shared/ui/Tarjeta';
import type { ResultadoDesembolso as Resultado } from '../api/desembolsos.api';

export function ResultadoDesembolso({ resultado }: { resultado: Resultado }) {
  const { desembolso } = resultado;
  const datos: [string, string][] = [
    ['Número de crédito', desembolso.numeroCredito],
    ['Monto', formatearMonto(desembolso.monto)],
    ['Banco', ETIQUETAS_BANCO[desembolso.banco]],
    ['Cuenta', desembolso.numeroCuenta],
    ['Fecha', formatearFecha(desembolso.fechaDesembolso)],
  ];

  return (
    <Tarjeta>
      <div role="status">
        <h3 className="text-lg font-semibold text-slate-900">
          Crédito {desembolso.numeroCredito} desembolsado
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Solicitud #{resultado.solicitudId} · Estado: {resultado.estado}
        </p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
        {datos.map(([termino, valor]) => (
          <div key={termino}>
            <dt className="text-slate-500">{termino}</dt>
            <dd className="font-medium text-slate-900">{valor}</dd>
          </div>
        ))}
      </dl>
      <Link
        to="/desembolsos"
        className="mt-6 inline-flex rounded-md px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
      >
        Volver a los desembolsos
      </Link>
    </Tarjeta>
  );
}
