import { EstadoSolicitud } from '@simulacion-credito/shared';
import { crearPuertosComite } from '../../../../test/support/comite-puertos';
import { unaSolicitud } from '../../../../test/support/solicitud-builders';
import {
  SolicitudNoEncontradaError,
  TransicionInvalidaError,
} from '../../solicitudes/domain/errores';
import { RechazarSolicitudUseCase } from './rechazar-solicitud.use-case';

describe('RechazarSolicitudUseCase', () => {
  let puertos: ReturnType<typeof crearPuertosComite>;
  let useCase: RechazarSolicitudUseCase;

  beforeEach(() => {
    puertos = crearPuertosComite();
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

    expect(puertos.solicitudes.registrarEvaluacion).toHaveBeenCalledWith(
      expect.objectContaining({ estado: EstadoSolicitud.RECHAZADA, observaciones: null }),
      EstadoSolicitud.PENDIENTE,
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
    expect(puertos.solicitudes.registrarEvaluacion).not.toHaveBeenCalled();
  });

  it('debe lanzar TransicionInvalidaError cuando otra petición la evaluó antes', async () => {
    puertos.solicitudes.registrarEvaluacion.mockResolvedValue(false);

    await expect(rechazar()).rejects.toThrow(TransicionInvalidaError);
  });
});
