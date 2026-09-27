import {
  calcularIndicadoresFinancieros,
  type Periodicidad,
  type TipoEmpleo,
} from '@simulacion-credito/shared';
import { desdeCentavos, desdePuntosBasicos } from '../../../core/domain/dinero';
import type { Solicitud } from '../../solicitudes/domain/solicitud';

// Vista de solo lectura para el dictamen del comité (CLAUDE.md §4): información personal,
// laboral y financiera. Incluye los 7 campos del enunciado y los indicadores de viabilidad
// calculados con packages/shared.
export interface SolicitudComiteVista {
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
    relacionCuotaIngreso: number | null;
    totalAPagar: number;
    totalIntereses: number;
  };
}

export function aSolicitudComiteVista(solicitud: Solicitud, ahora: Date): SolicitudComiteVista {
  const { cliente, laboral, condiciones } = solicitud;
  const monto = desdeCentavos(condiciones.montoCentavos);
  const tasaAnual = desdePuntosBasicos(condiciones.tasaAnualBps);
  const ingresoMensual = desdeCentavos(laboral.ingresoMensualCentavos);
  const indicadores = calcularIndicadoresFinancieros({
    monto,
    tasaAnual,
    cuotas: condiciones.cantidadCuotas,
    periodicidad: condiciones.periodicidad,
    ingresoMensual,
  });

  return {
    personal: {
      cedula: cliente.cedula,
      nombreCompleto: cliente.nombreCompleto,
      edad: solicitud.edadDelClienteA(ahora),
      fechaNacimiento: cliente.fechaNacimiento.toISOString().slice(0, 10),
      correo: cliente.correo,
      telefono: cliente.telefono,
    },
    laboral: {
      tipoEmpleo: laboral.tipoEmpleo,
      empresa: laboral.empresa,
      antiguedadLaboralAnios: laboral.antiguedadLaboralAnios,
      ingresoMensual,
    },
    financiero: {
      monto,
      tasaAnual,
      cantidadCuotas: condiciones.cantidadCuotas,
      periodicidad: condiciones.periodicidad,
      plazoMeses: solicitud.plazoMeses,
      ...indicadores,
    },
  };
}
