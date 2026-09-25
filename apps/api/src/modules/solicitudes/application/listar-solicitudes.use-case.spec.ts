import { EstadoSolicitud } from '@simulacion-credito/shared';
import { FakeClock } from '../../../../test/support/fake-clock';
import { HOY, unaSolicitud } from '../../../../test/support/solicitud-builders';
import type { SolicitudRepository } from '../domain/solicitud.repository';
import { ListarSolicitudesUseCase } from './listar-solicitudes.use-case';

describe('ListarSolicitudesUseCase', () => {
  let solicitudes: jest.Mocked<SolicitudRepository>;
  let useCase: ListarSolicitudesUseCase;

  beforeEach(() => {
    solicitudes = {
      crear: jest.fn(),
      listar: jest.fn().mockResolvedValue([]),
      buscarPorId: jest.fn(),
      registrarEvaluacion: jest.fn(),
    };
    useCase = new ListarSolicitudesUseCase(solicitudes, new FakeClock(HOY));
  });

  it('debe filtrar por el estado indicado', async () => {
    await useCase.ejecutar({ estado: EstadoSolicitud.PENDIENTE });

    expect(solicitudes.listar).toHaveBeenCalledWith({ estado: EstadoSolicitud.PENDIENTE });
  });

  it('debe devolver cada solicitud con montos en unidades, edad y plazo derivados', async () => {
    solicitudes.listar.mockResolvedValue([
      unaSolicitud().conFechaNacimiento('1990-01-01').persistida(3),
    ]);

    const [vista] = await useCase.ejecutar({});

    expect(vista).toEqual({
      id: 3,
      estado: EstadoSolicitud.PENDIENTE,
      observaciones: null,
      creadaEn: HOY,
      cliente: {
        cedula: '001-010190-0001A',
        nombreCompleto: 'Ana Pérez',
        correo: 'ana@correo.com',
        telefono: '88887777',
        fechaNacimiento: '1990-01-01',
        edad: 36,
      },
      empleo: {
        tipoEmpleo: 'ASALARIADO',
        empresa: 'Empresa S.A.',
        antiguedadLaboralAnios: 5,
        ingresoMensual: 25000.5,
      },
      credito: {
        monto: 10_000,
        tasaAnual: 12,
        cantidadCuotas: 12,
        periodicidad: 'MENSUAL',
        plazoMeses: 12,
        cuotaNivelada: 888.49,
      },
    });
  });
});
