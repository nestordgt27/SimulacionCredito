import { EstadoSolicitud } from '@simulacion-credito/shared';
import { crearPuertosSolicitudYCredito } from '../../../../test/support/puertos-solicitud-credito';
import { unaSolicitud } from '../../../../test/support/solicitud-builders';
import {
  SolicitudNoEncontradaError,
  TransicionInvalidaError,
} from '../../solicitudes/domain/errores';
import { RechazarSolicitudUseCase } from './rechazar-solicitud.use-case';

describe('RechazarSolicitudUseCase', () => {
  let puertos: ReturnType<typeof crearPuertosSolicitudYCredito>;
  let useCase: RechazarSolicitudUseCase;

  beforeEach(() => {
    puertos = crearPuertosSolicitudYCredito();
    useCase = new RechazarSolicitudUseCase(puertos.solicitudes, puertos.unitOfWork, puertos.clock);
    puertos.solicitudes.buscarPorId.mockResolvedValue(unaSolicitud().persistida(5));
  });

  const rechazar = (observaciones: string | null = 'Ingresos insuficientes') =>
    useCase.ejecutar({ solicitudId: 5, observaciones, evaluadorId: 9 });

  it('debe devolver la solicitud RECHAZADA con sus observaciones', async () => {
    await expect(rechazar()).resolves.toEqual({
      solicitudId: 5,
      estado: EstadoSolicitud.RECHAZADA,
      observaciones: 'Ingresos insuficientes',
    });
  });

  it('debe registrar la evaluación condicionada a que la solicitud siga PENDIENTE', async () => {
    await rechazar(null);

    expect(puertos.solicitudes.registrarTransicion).toHaveBeenCalledWith(
      expect.objectContaining({ estado: EstadoSolicitud.RECHAZADA, observaciones: null }),
      {
        estadoAnterior: EstadoSolicitud.PENDIENTE,
        usuarioId: 9,
        fecha: puertos.clock.ahora(),
        comentario: null,
      },
    );
  });

  it('debe lanzar SolicitudNoEncontradaError cuando la solicitud no existe', async () => {
    puertos.solicitudes.buscarPorId.mockResolvedValue(null);

    await expect(rechazar()).rejects.toThrow(SolicitudNoEncontradaError);
  });

  it('debe lanzar TransicionInvalidaError sin escribir cuando la solicitud ya fue aprobada', async () => {
    puertos.solicitudes.buscarPorId.mockResolvedValue(
      unaSolicitud().enEstado(EstadoSolicitud.APROBADA).persistida(5),
    );

    await expect(rechazar()).rejects.toThrow(TransicionInvalidaError);
    expect(puertos.solicitudes.registrarTransicion).not.toHaveBeenCalled();
  });

  it('debe lanzar TransicionInvalidaError cuando otra petición la evaluó antes', async () => {
    puertos.solicitudes.registrarTransicion.mockResolvedValue(false);

    await expect(rechazar()).rejects.toThrow(TransicionInvalidaError);
  });
});
