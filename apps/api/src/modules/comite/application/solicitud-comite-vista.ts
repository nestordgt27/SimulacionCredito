import type { Periodicidad } from '@simulacion-credito/shared';
import { desdeCentavos } from '../../../core/domain/dinero';
import type { Solicitud } from '../../solicitudes/domain/solicitud';

// Vista de solo lectura para el comité: exactamente los campos del enunciado (CLAUDE.md §4).
export interface SolicitudComiteVista {
  cedula: string;
  nombreCompleto: string;
  edad: number;
  cantidadCuotas: number;
  periodicidad: Periodicidad;
  plazoMeses: number;
  monto: number;
}

export function aSolicitudComiteVista(solicitud: Solicitud, ahora: Date): SolicitudComiteVista {
  return {
    cedula: solicitud.cliente.cedula,
    nombreCompleto: solicitud.cliente.nombreCompleto,
    edad: solicitud.edadDelClienteA(ahora),
    cantidadCuotas: solicitud.condiciones.cantidadCuotas,
    periodicidad: solicitud.condiciones.periodicidad,
    plazoMeses: solicitud.plazoMeses,
    monto: desdeCentavos(solicitud.condiciones.montoCentavos),
  };
}
