import { EstadoSolicitud } from '@simulacion-credito/shared';
import { crearPuertosComite } from '../../../../test/support/comite-puertos';
import { unaSolicitud } from '../../../../test/support/solicitud-builders';
import type { Credito } from '../../creditos/domain/credito';
import {
  ObservacionesRequeridasError,
  SolicitudNoEncontradaError,
  TransicionInvalidaError,
} from '../../solicitudes/domain/errores';
import { AprobarSolicitudUseCase } from './aprobar-solicitud.use-case';

describe('AprobarSolicitudUseCase', () => {
  let puertos: ReturnType<typeof crearPuertosComite>;
  let useCase: AprobarSolicitudUseCase;

  beforeEach(() => {
    puertos = crearPuertosComite();
    useCase = new AprobarSolicitudUseCase(
      puertos.solicitudes,
      puertos.creditos,
      puertos.numeros,
      puertos.unitOfWork,
      puertos.clock,
    );
    puertos.solicitudes.buscarPorId.mockResolvedValue(unaSolicitud().persistida(5));
  });

  const aprobar = (observaciones = 'Cumple con los requisitos') =>
    useCase.ejecutar({ solicitudId: 5, observaciones, evaluadorId: 9 });

  const creditoCreado = (): Credito => puertos.creditos.crear.mock.calls[0][0];

  const expectSinEscrituras = () => {
    expect(puertos.solicitudes.registrarEvaluacion).not.toHaveBeenCalled();
    expect(puertos.numeros.generar).not.toHaveBeenCalled();
    expect(puertos.creditos.crear).not.toHaveBeenCalled();
  };

  it('debe devolver la solicitud APROBADA con el número y las condiciones del crédito', async () => {
    const resultado = await aprobar();

    expect(resultado).toEqual({
      solicitudId: 5,
      estado: EstadoSolicitud.APROBADA,
      observaciones: 'Cumple con los requisitos',
      credito: {
        numeroCredito: 'CR-2026-000001',
        fechaAprobacion: puertos.clock.ahora(),
        monto: 10_000,
        tasaAnual: 12,
        cantidadCuotas: 12,
        periodicidad: 'MENSUAL',
        cuotaNivelada: 888.49,
      },
    });
  });

  it('debe registrar la evaluación condicionada a que la solicitud siga PENDIENTE', async () => {
    await aprobar();

    expect(puertos.solicitudes.registrarEvaluacion).toHaveBeenCalledWith(
      expect.objectContaining({ estado: EstadoSolicitud.APROBADA, evaluadaPorId: 9 }),
      EstadoSolicitud.PENDIENTE,
    );
  });

  it('debe pedir el número de crédito del año de aprobación', async () => {
    await aprobar();

    expect(puertos.numeros.generar).toHaveBeenCalledWith(2026);
  });

  it('debe crear el crédito con exactamente N cuotas del plan de pagos', async () => {
    await aprobar();

    expect(creditoCreado()).toMatchObject({ solicitudId: 5, numeroCredito: 'CR-2026-000001' });
    expect(creditoCreado().cuotas).toHaveLength(12);
    expect(creditoCreado().cuotas.at(-1)?.saldoCentavos).toBe(0);
  });

  it('debe lanzar SolicitudNoEncontradaError sin escribir cuando la solicitud no existe', async () => {
    puertos.solicitudes.buscarPorId.mockResolvedValue(null);

    await expect(aprobar()).rejects.toThrow(SolicitudNoEncontradaError);
    expectSinEscrituras();
  });

  it('debe lanzar ObservacionesRequeridasError sin escribir cuando no hay observaciones', async () => {
    await expect(aprobar('   ')).rejects.toThrow(ObservacionesRequeridasError);
    expectSinEscrituras();
  });

  it.each([EstadoSolicitud.APROBADA, EstadoSolicitud.RECHAZADA, EstadoSolicitud.DESEMBOLSADA])(
    'debe lanzar TransicionInvalidaError sin escribir cuando la solicitud está %s',
    async (estado) => {
      puertos.solicitudes.buscarPorId.mockResolvedValue(
        unaSolicitud().enEstado(estado).persistida(5),
      );

      await expect(aprobar()).rejects.toThrow(TransicionInvalidaError);
      expectSinEscrituras();
    },
  );

  it('debe lanzar TransicionInvalidaError sin crear crédito cuando otra petición la evaluó antes', async () => {
    puertos.solicitudes.registrarEvaluacion.mockResolvedValue(false);

    await expect(aprobar()).rejects.toThrow(TransicionInvalidaError);
    expect(puertos.numeros.generar).not.toHaveBeenCalled();
    expect(puertos.creditos.crear).not.toHaveBeenCalled();
  });
});
