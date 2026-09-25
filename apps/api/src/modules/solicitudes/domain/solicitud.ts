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
import {
  EdadNoPermitidaError,
  FechaNacimientoInvalidaError,
  ObservacionesRequeridasError,
} from './errores';
import { SolicitudStateMachine } from './solicitud-state-machine';

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
  evaluadaPorId: number | null;
  fechaEvaluacion: Date | null;
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
  readonly evaluadaPorId: number | null;
  readonly fechaEvaluacion: Date | null;
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
    this.evaluadaPorId = datos.evaluadaPorId;
    this.fechaEvaluacion = datos.fechaEvaluacion;
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
      evaluadaPorId: null,
      fechaEvaluacion: null,
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

  /** Dictamen favorable del comité. Las observaciones son obligatorias (CLAUDE.md §4). */
  aprobar(observaciones: string, evaluadorId: number, ahora: Date): Solicitud {
    const texto = observaciones.trim();
    if (texto === '') {
      throw new ObservacionesRequeridasError();
    }
    return this.evaluar(EstadoSolicitud.APROBADA, texto, evaluadorId, ahora);
  }

  rechazar(observaciones: string | null, evaluadorId: number, ahora: Date): Solicitud {
    const texto = observaciones?.trim() || null;
    return this.evaluar(EstadoSolicitud.RECHAZADA, texto, evaluadorId, ahora);
  }

  private evaluar(
    destino: EstadoSolicitud,
    observaciones: string | null,
    evaluadorId: number,
    ahora: Date,
  ): Solicitud {
    SolicitudStateMachine.assertTransicion(this.estado, destino);

    return new Solicitud({
      ...this.datos(),
      estado: destino,
      observaciones,
      evaluadaPorId: evaluadorId,
      fechaEvaluacion: ahora,
    });
  }

  private datos(): DatosSolicitud {
    return {
      id: this._id,
      cliente: this.cliente,
      laboral: this.laboral,
      condiciones: this.condiciones,
      cuotaNiveladaCentavos: this.cuotaNiveladaCentavos,
      estado: this.estado,
      observaciones: this.observaciones,
      creadaPorId: this.creadaPorId,
      creadaEn: this.creadaEn,
      evaluadaPorId: this.evaluadaPorId,
      fechaEvaluacion: this.fechaEvaluacion,
    };
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
