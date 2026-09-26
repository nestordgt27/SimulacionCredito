import type { Banco, EstadoSolicitud, Periodicidad } from '@simulacion-credito/shared';
import { clienteHttp } from '../../../shared/api/cliente-http';
import type { DatosBancarios } from '../schemas/desembolso.schema';

/** Elemento de GET /solicitudes?estado=APROBADA (solo los campos que usa la pantalla). */
export interface SolicitudAprobada {
  id: number;
  observaciones: string | null;
  cliente: { cedula: string; nombreCompleto: string };
  credito: {
    monto: number;
    cantidadCuotas: number;
    periodicidad: Periodicidad;
    cuotaNivelada: number;
  };
}

/** Respuesta de POST /desembolsos/:solicitudId. */
export interface ResultadoDesembolso {
  solicitudId: number;
  estado: EstadoSolicitud;
  desembolso: {
    numeroCredito: string;
    banco: Banco;
    numeroCuenta: string;
    monto: number;
    fechaDesembolso: string;
  };
}

export async function listarAprobadas(): Promise<SolicitudAprobada[]> {
  const { data } = await clienteHttp.get<SolicitudAprobada[]>('/solicitudes', {
    params: { estado: 'APROBADA' },
  });
  return data;
}

export async function desembolsar(
  solicitudId: number,
  datos: DatosBancarios,
): Promise<ResultadoDesembolso> {
  const { data } = await clienteHttp.post<ResultadoDesembolso>(
    `/desembolsos/${solicitudId}`,
    datos,
  );
  return data;
}
