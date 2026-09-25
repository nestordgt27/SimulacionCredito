import {
  calcularCuotaNivelada,
  calcularPlazoMeses,
  EDAD_MAXIMA,
  EstadoSolicitud,
  type Periodicidad,
  type TipoEmpleo,
} from '@simulacion-credito/shared';
import { aCentavos, desdeCentavos, desdePuntosBasicos } from '../../../core/domain/dinero';
import type { Cliente } from './cliente';
import { EdadNoPermitidaError, FechaNacimientoInvalidaError } from './errores';

export interface DatosLaborales {
  tipoEmpleo: TipoEmpleo;
  empresa: string;
  antiguedadLaboralAnios: number;
  ingresoMensualCentavos: number;
}

export interface CondicionesCredito {
  montoCentavos: number;
  tasaAnualBps: number;
  cantidadCuotas: number;
  periodicidad: Periodicidad;
}

export interface NuevaSolicitud {
  cliente: Cliente;
  laboral: DatosLaborales;
  condiciones: CondicionesCredito;
  creadaPorId: number;
}

export interface DatosSolicitud extends NuevaSolicitud {
  id: number | null;
  cuotaNiveladaCentavos: number;
  estado: EstadoSolicitud;
  observaciones: string | null;
  creadaEn: Date;
}

export class Solicitud {
  readonly cliente: Cliente;
  readonly laboral: DatosLaborales;
  readonly condiciones: CondicionesCredito;
  readonly cuotaNiveladaCentavos: number;
  readonly estado: EstadoSolicitud;
  readonly observaciones: string | null;
  readonly creadaPorId: number;
  readonly creadaEn: Date;
  private readonly _id: number | null;

  private constructor(datos: DatosSolicitud) {
    this._id = datos.id;
    this.cliente = datos.cliente;
    this.laboral = datos.laboral;
    this.condiciones = datos.condiciones;
    this.cuotaNiveladaCentavos = datos.cuotaNiveladaCentavos;
    this.estado = datos.estado;
    this.observaciones = datos.observaciones;
    this.creadaPorId = datos.creadaPorId;
    this.creadaEn = datos.creadaEn;
  }

  /**
   * Registra una solicitud nueva en estado PENDIENTE. Aplica la regla de edad y calcula la cuota
   * nivelada con packages/shared: no existe forma de crear una solicitud con una cuota externa.
   */
  static crear(nueva: NuevaSolicitud, ahora: Date): Solicitud {
    if (nueva.cliente.naceDespuesDe(ahora)) {
      throw new FechaNacimientoInvalidaError();
    }
    const edad = nueva.cliente.edadA(ahora);
    if (edad > EDAD_MAXIMA) {
      throw new EdadNoPermitidaError(edad);
    }

    return new Solicitud({
      ...nueva,
      id: null,
      cuotaNiveladaCentavos: Solicitud.calcularCuota(nueva.condiciones),
      estado: EstadoSolicitud.PENDIENTE,
      observaciones: null,
      creadaEn: ahora,
    });
  }

  /** Reconstruye una solicitud ya persistida (sin volver a aplicar las reglas de creación). */
  static reconstituir(datos: DatosSolicitud & { id: number }): Solicitud {
    return new Solicitud(datos);
  }

  private static calcularCuota(condiciones: CondicionesCredito): number {
    const cuota = calcularCuotaNivelada(
      desdeCentavos(condiciones.montoCentavos),
      desdePuntosBasicos(condiciones.tasaAnualBps),
      condiciones.cantidadCuotas,
      condiciones.periodicidad,
    );
    return aCentavos(cuota);
  }

  get id(): number {
    if (this._id === null) {
      throw new Error('La solicitud todavía no fue persistida');
    }
    return this._id;
  }

  get plazoMeses(): number {
    return calcularPlazoMeses(this.condiciones.cantidadCuotas, this.condiciones.periodicidad);
  }

  edadDelClienteA(fecha: Date): number {
    return this.cliente.edadA(fecha);
  }
}
