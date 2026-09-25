import { Periodicidad, TipoEmpleo } from '@simulacion-credito/shared';
import type { CrearSolicitudComando } from '../../src/modules/solicitudes/application/crear-solicitud.use-case';
import { Cliente } from '../../src/modules/solicitudes/domain/cliente';
import {
  Solicitud,
  type CondicionesCredito,
  type NuevaSolicitud,
} from '../../src/modules/solicitudes/domain/solicitud';

export const HOY = new Date('2026-09-25T12:00:00Z');

const fecha = (iso: string) => new Date(`${iso}T00:00:00Z`);

// Por defecto: 10 000 al 12 % en 12 cuotas mensuales (cuota nivelada 888,49), cliente de 36 años.
class SolicitudBuilder {
  private fechaNacimiento = fecha('1990-01-01');
  private cedula = '001-010190-0001A';
  private condiciones: CondicionesCredito = {
    montoCentavos: 1_000_000,
    tasaAnualBps: 1200,
    cantidadCuotas: 12,
    periodicidad: Periodicidad.MENSUAL,
  };
  private creadaPorId = 1;

  conFechaNacimiento(iso: string): this {
    this.fechaNacimiento = fecha(iso);
    return this;
  }

  conCedula(cedula: string): this {
    this.cedula = cedula;
    return this;
  }

  conCondiciones(condiciones: Partial<CondicionesCredito>): this {
    this.condiciones = { ...this.condiciones, ...condiciones };
    return this;
  }

  creadaPor(usuarioId: number): this {
    this.creadaPorId = usuarioId;
    return this;
  }

  build(): NuevaSolicitud {
    return {
      cliente: new Cliente({
        cedula: this.cedula,
        nombreCompleto: 'Ana Pérez',
        correo: 'ana@correo.com',
        telefono: '88887777',
        fechaNacimiento: this.fechaNacimiento,
      }),
      laboral: {
        tipoEmpleo: TipoEmpleo.ASALARIADO,
        empresa: 'Empresa S.A.',
        antiguedadLaboralAnios: 5,
        ingresoMensualCentavos: 2_500_050,
      },
      condiciones: { ...this.condiciones },
      creadaPorId: this.creadaPorId,
    };
  }

  /** Solicitud nueva (sin id), creada con las reglas del dominio. */
  crear(ahora = HOY): Solicitud {
    return Solicitud.crear(this.build(), ahora);
  }

  /** Solicitud como la devolvería el repositorio. */
  persistida(id = 1, ahora = HOY): Solicitud {
    const nueva = this.crear(ahora);
    return Solicitud.reconstituir({
      ...this.build(),
      id,
      cuotaNiveladaCentavos: nueva.cuotaNiveladaCentavos,
      estado: nueva.estado,
      observaciones: null,
      creadaEn: nueva.creadaEn,
    });
  }
}

export const unaSolicitud = () => new SolicitudBuilder();

// Comando en unidades, tal como lo arma el controller a partir del DTO.
export function unComandoCrearSolicitud(
  cambios: Partial<Pick<CrearSolicitudComando, 'credito'>> & { fechaNacimiento?: string } = {},
): CrearSolicitudComando {
  return {
    cliente: {
      cedula: '001-010190-0001A',
      nombreCompleto: 'Ana Pérez',
      correo: 'ana@correo.com',
      telefono: '88887777',
      fechaNacimiento: fecha(cambios.fechaNacimiento ?? '1990-01-01'),
    },
    empleo: {
      tipoEmpleo: TipoEmpleo.ASALARIADO,
      empresa: 'Empresa S.A.',
      antiguedadLaboralAnios: 5,
      ingresoMensual: 25000.5,
    },
    credito: cambios.credito ?? {
      monto: 10_000,
      tasaAnual: 12,
      cantidadCuotas: 12,
      periodicidad: Periodicidad.MENSUAL,
    },
    creadaPorId: 1,
  };
}
