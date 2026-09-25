import { crearPuertosSolicitudYCredito } from '../../../../test/support/puertos-solicitud-credito';
import { unaSolicitud } from '../../../../test/support/solicitud-builders';
import { SolicitudNoEncontradaError } from '../../solicitudes/domain/errores';
import { ObtenerSolicitudComiteUseCase } from './obtener-solicitud-comite.use-case';

describe('ObtenerSolicitudComiteUseCase', () => {
  let puertos: ReturnType<typeof crearPuertosSolicitudYCredito>;
  let useCase: ObtenerSolicitudComiteUseCase;

  beforeEach(() => {
    puertos = crearPuertosSolicitudYCredito();
    useCase = new ObtenerSolicitudComiteUseCase(puertos.solicitudes, puertos.clock);
  });

  it('debe devolver solo cédula, nombre, edad, cuotas, periodicidad, plazo y monto', async () => {
    puertos.solicitudes.buscarPorId.mockResolvedValue(
      unaSolicitud().conFechaNacimiento('1990-01-01').persistida(5),
    );

    const vista = await useCase.ejecutar(5);

    expect(vista).toStrictEqual({
      cedula: '001-010190-0001A',
      nombreCompleto: 'Ana Pérez',
      edad: 36,
      cantidadCuotas: 12,
      periodicidad: 'MENSUAL',
      plazoMeses: 12,
      monto: 10_000,
    });
  });

  it('debe lanzar SolicitudNoEncontradaError cuando la solicitud no existe', async () => {
    puertos.solicitudes.buscarPorId.mockResolvedValue(null);

    await expect(useCase.ejecutar(99)).rejects.toThrow(SolicitudNoEncontradaError);
  });
});
