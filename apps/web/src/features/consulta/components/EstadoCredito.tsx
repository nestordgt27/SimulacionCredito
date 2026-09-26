import { EstadoSolicitud } from '@simulacion-credito/shared';

const ESTILOS: Partial<Record<EstadoSolicitud, { texto: string; clase: string }>> = {
  [EstadoSolicitud.APROBADA]: {
    texto: 'Aprobado · pendiente de desembolso',
    clase: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  [EstadoSolicitud.DESEMBOLSADA]: {
    texto: 'Desembolsado',
    clase: 'bg-teal-50 text-teal-800 ring-teal-200',
  },
};

// Un crédito solo existe para solicitudes APROBADA o DESEMBOLSADA.
export function EstadoCredito({ estado }: { estado: EstadoSolicitud }) {
  const { texto, clase } = ESTILOS[estado] ?? {
    texto: estado,
    clase: 'bg-slate-50 text-slate-700 ring-slate-200',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${clase}`}>
      {texto}
    </span>
  );
}
