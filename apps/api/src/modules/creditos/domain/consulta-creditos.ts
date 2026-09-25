import type { Banco, EstadoSolicitud, Periodicidad } from '@simulacion-credito/shared';
import type { CuotaPlan } from './credito';

// Modelo de lectura (solo consulta): separado de CreditoRepository, que es de escritura
// (CLAUDE.md §3, segregación de interfaces). Montos en centavos y tasa en puntos básicos.
export interface CreditoDetalle {
  numeroCredito: string;
  solicitudId: number;
  estado: EstadoSolicitud;
  fechaAprobacion: Date;
  cliente: { cedula: string; nombreCompleto: string };
  montoCentavos: number;
  tasaAnualBps: number;
  cantidadCuotas: number;
  periodicidad: Periodicidad;
  cuotaNiveladaCentavos: number;
  desembolso: { banco: Banco; fechaDesembolso: Date } | null;
  /** Ordenadas por número de cuota. */
  cuotas: CuotaPlan[];
}

export interface ConsultaCreditos {
  /** Créditos del cliente, del más reciente al más antiguo. Vacío si no tiene. */
  porCedula(cedula: string): Promise<CreditoDetalle[]>;
}

export const CONSULTA_CREDITOS = Symbol('CONSULTA_CREDITOS');
