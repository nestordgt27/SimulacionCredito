import { EstadoSolicitud, Periodicidad } from '@simulacion-credito/shared';
import { FakeClock } from '../../../../test/support/fake-clock';
import { FakeUnitOfWork } from '../../../../test/support/fake-unit-of-work';
import { HOY, unComandoCrearSolicitud } from '../../../../test/support/solicitud-builders';
import { EdadNoPermitidaError } from '../domain/errores';
import { Solicitud } from '../domain/solicitud';
import type { SolicitudRepository } from '../domain/solicitud.repository';
import { CrearSolicitudUseCase } from './crear-solicitud.use-case';

describe('CrearSolicitudUseCase', () => {
  let solicitudes: jest.Mocked<SolicitudRepository>;
  let useCase: CrearSolicitudUseCase;

  beforeEach(() => {
    solicitudes = {
      // Simula la persistencia: devuelve la misma solicitud con id asignado.
      crear: jest.fn((solicitud: Solicitud) =>
        Promise.resolve(
          Solicitud.reconstituir({
            id: 42,
            cliente: solicitud.cliente,
            laboral: solicitud.laboral,
            condiciones: solicitud.condiciones,
            cuotaNiveladaCentavos: solicitud.cuotaNiveladaCentavos,
            estado: solicitud.estado,
            observaciones: solicitud.observaciones,
            creadaPorId: solicitud.creadaPorId,
            creadaEn: solicitud.creadaEn,
          }),
        ),
      ),
      listar: jest.fn(),
    };
    useCase = new CrearSolicitudUseCase(solicitudes, new FakeUnitOfWork(), new FakeClock(HOY));
  });

  it('debe devolver la solicitud PENDIENTE con la cuota calculada por el servidor', async () => {
    const vista = await useCase.ejecutar(unComandoCrearSolicitud());

    expect(vista).toMatchObject({
      id: 42,
      estado: EstadoSolicitud.PENDIENTE,
      credito: { monto: 10_000, tasaAnual: 12, plazoMeses: 12, cuotaNivelada: 888.49 },
    });
  });

  it('debe persistir montos en centavos y la tasa en puntos básicos', async () => {
    await useCase.ejecutar(
      unComandoCrearSolicitud({
        credito: {
          monto: 15000.5,
          tasaAnual: 18.25,
          cantidadCuotas: 24,
          periodicidad: Periodicidad.QUINCENAL,
        },
      }),
    );

    const [guardada] = solicitudes.crear.mock.calls[0];
    expect(guardada.condiciones).toEqual({
      montoCentavos: 1_500_050,
      tasaAnualBps: 1825,
      cantidadCuotas: 24,
      periodicidad: Periodicidad.QUINCENAL,
    });
    expect(guardada.laboral.ingresoMensualCentavos).toBe(2_500_050);
  });

  it('debe informar la edad del cliente calculada con el reloj', async () => {
    const vista = await useCase.ejecutar(
      unComandoCrearSolicitud({ fechaNacimiento: '1945-09-26' }),
    );

    expect(vista.cliente).toMatchObject({ fechaNacimiento: '1945-09-26', edad: 80 });
  });

  it('debe rechazar al cliente mayor de 80 años sin persistir nada', async () => {
    const crear = useCase.ejecutar(unComandoCrearSolicitud({ fechaNacimiento: '1945-09-25' }));

    await expect(crear).rejects.toThrow(EdadNoPermitidaError);
    expect(solicitudes.crear).not.toHaveBeenCalled();
  });
});
