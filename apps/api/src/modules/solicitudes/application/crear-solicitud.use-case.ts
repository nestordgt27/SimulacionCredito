import { Inject, Injectable } from '@nestjs/common';
import type { Periodicidad, TipoEmpleo } from '@simulacion-credito/shared';
import { CLOCK, type Clock } from '../../../core/domain/clock';
import { aCentavos, aPuntosBasicos } from '../../../core/domain/dinero';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../core/domain/unit-of-work';
import { Cliente } from '../domain/cliente';
import { Solicitud } from '../domain/solicitud';
import { SOLICITUD_REPOSITORY, type SolicitudRepository } from '../domain/solicitud.repository';
import { aSolicitudVista, type SolicitudVista } from './solicitud-vista';

// Datos de entrada en unidades (tal como llegan por HTTP). No incluye la cuota: la calcula el dominio.
export interface CrearSolicitudComando {
  cliente: {
    cedula: string;
    nombreCompleto: string;
    correo: string;
    telefono: string;
    fechaNacimiento: Date;
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
  };
  creadaPorId: number;
}

@Injectable()
export class CrearSolicitudUseCase {
  constructor(
    @Inject(SOLICITUD_REPOSITORY) private readonly solicitudes: SolicitudRepository,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async ejecutar({
    cliente,
    empleo,
    credito,
    creadaPorId,
  }: CrearSolicitudComando): Promise<SolicitudVista> {
    const ahora = this.clock.ahora();
    const solicitud = Solicitud.crear(
      {
        cliente: new Cliente(cliente),
        laboral: {
          tipoEmpleo: empleo.tipoEmpleo,
          empresa: empleo.empresa,
          antiguedadLaboralAnios: empleo.antiguedadLaboralAnios,
          ingresoMensualCentavos: aCentavos(empleo.ingresoMensual),
        },
        condiciones: {
          montoCentavos: aCentavos(credito.monto),
          tasaAnualBps: aPuntosBasicos(credito.tasaAnual),
          cantidadCuotas: credito.cantidadCuotas,
          periodicidad: credito.periodicidad,
        },
        creadaPorId,
      },
      ahora,
    );

    const guardada = await this.unitOfWork.run(() => this.solicitudes.crear(solicitud));
    return aSolicitudVista(guardada, ahora);
  }
}
