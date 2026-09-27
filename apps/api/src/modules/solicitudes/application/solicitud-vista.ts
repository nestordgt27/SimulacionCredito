import type { EstadoSolicitud, Periodicidad, TipoEmpleo } from '@simulacion-credito/shared';
import { desdeCentavos, desdePuntosBasicos } from '../../../core/domain/dinero';
import type { Solicitud } from '../domain/solicitud';

// Representación de salida: montos en unidades y datos derivados (edad, plazo) calculados al vuelo.
export interface SolicitudVista {
  id: number;
  estado: EstadoSolicitud;
  observaciones: string | null;
  creadaEn: Date;
  cliente: {
    cedula: string;
    nombreCompleto: string;
    correo: string;
    telefono: string;
    /** YYYY-MM-DD */
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

export function aSolicitudVista(solicitud: Solicitud, ahora: Date): SolicitudVista {
  const { cliente, laboral, condiciones } = solicitud;

  return {
    id: solicitud.id,
    estado: solicitud.estado,
    observaciones: solicitud.observaciones,
    creadaEn: solicitud.creadaEn,
    cliente: {
      cedula: cliente.cedula,
      nombreCompleto: cliente.nombreCompleto,
      correo: cliente.correo,
      telefono: cliente.telefono,
      fechaNacimiento: cliente.fechaNacimiento.toISOString().slice(0, 10),
      edad: solicitud.edadDelClienteA(ahora),
    },
    empleo: {
      tipoEmpleo: laboral.tipoEmpleo,
      empresa: laboral.empresa,
      antiguedadLaboralAnios: laboral.antiguedadLaboralAnios,
      ingresoMensual: desdeCentavos(laboral.ingresoMensualCentavos),
    },
    credito: {
      monto: desdeCentavos(condiciones.montoCentavos),
      tasaAnual: desdePuntosBasicos(condiciones.tasaAnualBps),
      cantidadCuotas: condiciones.cantidadCuotas,
      periodicidad: condiciones.periodicidad,
      plazoMeses: solicitud.plazoMeses,
      cuotaNivelada: desdeCentavos(solicitud.cuotaNiveladaCentavos),
    },
  };
}
