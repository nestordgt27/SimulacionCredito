import type { Banco, EstadoSolicitud, Periodicidad } from '@simulacion-credito/shared';
import { clienteHttp } from '../../../shared/api/cliente-http';

/** Fila del plan: mismos nombres que el CuotaPlan de generarPlanPagos (packages/shared). */
export interface CuotaPlanConsultada {
  numero: number;
  fechaVencimiento: string;
  cuota: number;
  capital: number;
  interes: number;
  saldo: number;
}

/** Elemento de GET /creditos?cedula=. */
export interface CreditoConsultado {
  numeroCredito: string;
  solicitudId: number;
  estado: EstadoSolicitud;
  fechaAprobacion: string;
  cliente: { cedula: string; nombreCompleto: string };
  monto: number;
  tasaAnual: number;
  cantidadCuotas: number;
  periodicidad: Periodicidad;
  plazoMeses: number;
  cuotaNivelada: number;
  desembolso: { banco: Banco; fechaDesembolso: string } | null;
  planPagos: CuotaPlanConsultada[];
}

export async function consultarCreditos(cedula: string): Promise<CreditoConsultado[]> {
  const { data } = await clienteHttp.get<CreditoConsultado[]>('/creditos', { params: { cedula } });
  return data;
}
