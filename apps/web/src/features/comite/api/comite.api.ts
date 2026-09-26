import type { EstadoSolicitud, Periodicidad, TipoEmpleo } from '@simulacion-credito/shared';
import { clienteHttp } from '../../../shared/api/cliente-http';

/** Elemento de GET /solicitudes?estado=PENDIENTE (solo los campos que usa la bandeja). */
export interface SolicitudPendiente {
  id: number;
  creadaEn: string;
  cliente: { cedula: string; nombreCompleto: string };
  credito: { monto: number; cantidadCuotas: number; periodicidad: Periodicidad };
}

/** GET /comite/solicitudes/:id: información personal, laboral y financiera para el dictamen. */
export interface SolicitudComite {
  personal: {
    cedula: string;
    nombreCompleto: string;
    edad: number;
    /** YYYY-MM-DD */
    fechaNacimiento: string;
    correo: string;
    telefono: string;
  };
  laboral: {
    tipoEmpleo: TipoEmpleo;
    empresa: string;
    antiguedadLaboralAnios: number;
    ingresoMensual: number;
  };
  financiero: {
    monto: number;
    tasaAnual: number;
    cantidadCuotas: number;
    periodicidad: Periodicidad;
    plazoMeses: number;
    cuotaNivelada: number;
    cuotaMensualEquivalente: number;
    /** Porcentaje del ingreso mensual; null si el ingreso es 0. */
    relacionCuotaIngreso: number | null;
    totalAPagar: number;
    totalIntereses: number;
  };
}

export interface ResultadoAprobacion {
  solicitudId: number;
  estado: EstadoSolicitud;
  observaciones: string | null;
  credito: {
    numeroCredito: string;
    fechaAprobacion: string;
    monto: number;
    tasaAnual: number;
    cantidadCuotas: number;
    periodicidad: Periodicidad;
    cuotaNivelada: number;
  };
}

export interface ResultadoRechazo {
  solicitudId: number;
  estado: EstadoSolicitud;
  observaciones: string | null;
}

export async function listarPendientes(): Promise<SolicitudPendiente[]> {
  const { data } = await clienteHttp.get<SolicitudPendiente[]>('/solicitudes', {
    params: { estado: 'PENDIENTE' },
  });
  return data;
}

export async function obtenerSolicitud(id: number): Promise<SolicitudComite> {
  const { data } = await clienteHttp.get<SolicitudComite>(`/comite/solicitudes/${id}`);
  return data;
}

export async function aprobarSolicitud(
  id: number,
  observaciones: string,
): Promise<ResultadoAprobacion> {
  const { data } = await clienteHttp.post<ResultadoAprobacion>(
    `/comite/solicitudes/${id}/aprobar`,
    { observaciones },
  );
  return data;
}

export async function rechazarSolicitud(
  id: number,
  observaciones: string | undefined,
): Promise<ResultadoRechazo> {
  const { data } = await clienteHttp.post<ResultadoRechazo>(
    `/comite/solicitudes/${id}/rechazar`,
    observaciones ? { observaciones } : {},
  );
  return data;
}
