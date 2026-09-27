import { formatearMeses, formatearMonto } from '../../../shared/lib/formato';
import type { CuotaEstimada } from '../hooks/useCuotaEstimada';

export function ResumenCuota({ estimacion }: { estimacion: CuotaEstimada | null }) {
  return (
    <section
      aria-label="Cuota estimada"
      aria-live="polite"
      className="rounded-lg bg-teal-50 p-4 ring-1 ring-teal-200 md:col-span-2"
    >
      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-teal-800">Cuota nivelada estimada</dt>
          <dd className="text-2xl font-semibold text-teal-900">
            {estimacion ? formatearMonto(estimacion.cuotaNivelada) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-teal-800">Plazo</dt>
          <dd className="text-2xl font-semibold text-teal-900">
            {estimacion ? formatearMeses(estimacion.plazoMeses) : '—'}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-teal-800">
        Cálculo informativo: el servidor recalcula la cuota al registrar la solicitud.
      </p>
    </section>
  );
}
