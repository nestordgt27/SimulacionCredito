import type { EstadoSolicitud, Periodicidad, TipoEmpleo } from '@simulacion-credito/shared';
import { clienteHttp } from '../../../shared/api/cliente-http';
import type { SolicitudValida } from '../schemas/solicitud.schema';

/** Respuesta de la API (SolicitudVista del backend). */
export interface SolicitudRegistrada {
  id: number;
  estado: EstadoSolicitud;
  observaciones: string | null;
  creadaEn: string;
  cliente: {
    cedula: string;
    nombreCompleto: string;
    correo: string;
    telefono: string;
    fechaNacimiento: string;
    edad: number;
  };
  empleo: {
    tipoEmpleo: TipoEmpleo;
    empresa: string;
    antiguedadLaboralAnios: number;
    ingresoMensual: number;
  };
  credito: {
    monto: number;
    tasaAnual: number;
    cantidadCuotas: number;
    periodicidad: Periodicidad;
    plazoMeses: number;
    cuotaNivelada: number;
  };
}

// No se envía la cuota: la calcula siempre el servidor.
export async function crearSolicitud(solicitud: SolicitudValida): Promise<SolicitudRegistrada> {
  const { data } = await clienteHttp.post<SolicitudRegistrada>('/solicitudes', solicitud);
  return data;
}
