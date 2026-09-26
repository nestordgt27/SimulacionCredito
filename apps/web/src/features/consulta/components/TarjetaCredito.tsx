import { useId, useState } from 'react';
import { ETIQUETAS_BANCO, ETIQUETAS_PERIODICIDAD } from '../../../shared/lib/etiquetas';
import { formatearFecha, formatearMeses, formatearMonto } from '../../../shared/lib/formato';
import { Boton } from '../../../shared/ui/Boton';
import type { CreditoConsultado } from '../api/creditos.api';
import { EstadoCredito } from './EstadoCredito';
import { TablaPlanPagos } from './TablaPlanPagos';

export function TarjetaCredito({ credito }: { credito: CreditoConsultado }) {
  const [planVisible, setPlanVisible] = useState(false);
  const idPlan = useId();
  const idTitulo = useId();

  const datos: [string, string][] = [
    ['Monto', formatearMonto(credito.monto)],
    ['Tasa anual', `${credito.tasaAnual.toLocaleString('es-NI')} %`],
    [
      'Cuotas',
      `${credito.cantidadCuotas} (${ETIQUETAS_PERIODICIDAD[credito.periodicidad].toLowerCase()})`,
    ],
    ['Plazo', formatearMeses(credito.plazoMeses)],
    ['Cuota nivelada', formatearMonto(credito.cuotaNivelada)],
    ['Aprobado el', formatearFecha(credito.fechaAprobacion)],
    [
      'Desembolso',
      credito.desembolso
        ? `${ETIQUETAS_BANCO[credito.desembolso.banco]}, ${formatearFecha(credito.desembolso.fechaDesembolso)}`
        : 'Pendiente',
    ],
  ];

  return (
    <article
      aria-labelledby={idTitulo}
      className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id={idTitulo} className="text-lg font-semibold text-slate-900">
            {credito.numeroCredito}
          </h3>
          <p className="text-sm text-slate-600">
            {credito.cliente.nombreCompleto} · {credito.cliente.cedula} · Solicitud #
            {credito.solicitudId}
          </p>
        </div>
        <EstadoCredito estado={credito.estado} />
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        {datos.map(([termino, valor]) => (
          <div key={termino}>
            <dt className="text-slate-500">{termino}</dt>
            <dd className="font-medium text-slate-900">{valor}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4">
        <Boton
          variante="secundario"
          aria-expanded={planVisible}
          aria-controls={idPlan}
          onClick={() => setPlanVisible((visible) => !visible)}
        >
          {planVisible ? 'Ocultar plan de pagos' : 'Ver plan de pagos'}
        </Boton>
      </div>
      <div id={idPlan} hidden={!planVisible} className="mt-4">
        {planVisible && (
          <TablaPlanPagos numeroCredito={credito.numeroCredito} planPagos={credito.planPagos} />
        )}
      </div>
    </article>
  );
}
