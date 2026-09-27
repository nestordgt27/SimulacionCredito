import { Banco, EstadoSolicitud } from '@simulacion-credito/shared';
import { crearPuertosSolicitudYCredito } from '../../../../test/support/puertos-solicitud-credito';
import { unaSolicitud } from '../../../../test/support/solicitud-builders';
import { CreditoNoEncontradoError } from '../../creditos/domain/errores';
import {
  SolicitudNoEncontradaError,
  TransicionInvalidaError,
} from '../../solicitudes/domain/errores';
import type { DesembolsoRepository } from '../domain/desembolso.repository';
import { DesembolsarCreditoUseCase } from './desembolsar-credito.use-case';

describe('DesembolsarCreditoUseCase', () => {
  let puertos: ReturnType<typeof crearPuertosSolicitudYCredito>;
  let desembolsos: jest.Mocked<DesembolsoRepository>;
  let useCase: DesembolsarCreditoUseCase;

  beforeEach(() => {
    puertos = crearPuertosSolicitudYCredito();
    desembolsos = { crear: jest.fn().mockResolvedValue(undefined) };
    useCase = new DesembolsarCreditoUseCase(
      puertos.solicitudes,
      puertos.creditos,
      desembolsos,
      puertos.unitOfWork,
      puertos.clock,
    );
    puertos.solicitudes.buscarPorId.mockResolvedValue(
      unaSolicitud().enEstado(EstadoSolicitud.APROBADA).persistida(5),
    );
    puertos.creditos.buscarPorSolicitud.mockResolvedValue({
      id: 3,
      numeroCredito: 'CR-2026-000001',
      montoCentavos: 1_000_000,
    });
  });

  const desembolsar = () =>
    useCase.ejecutar({
      solicitudId: 5,
      banco: Banco.BAC_CREDOMATIC,
      numeroCuenta: '000123456',
      usuarioId: 2,
    });

  const expectSinEscrituras = () => {
    expect(puertos.solicitudes.registrarTransicion).not.toHaveBeenCalled();
    expect(desembolsos.crear).not.toHaveBeenCalled();
  };

  it('debe devolver la solicitud DESEMBOLSADA con los datos del desembolso', async () => {
    await expect(desembolsar()).resolves.toEqual({
      solicitudId: 5,
      estado: EstadoSolicitud.DESEMBOLSADA,
      desembolso: {
        numeroCredito: 'CR-2026-000001',
        banco: Banco.BAC_CREDOMATIC,
        numeroCuenta: '000123456',
        monto: 10_000,
        fechaDesembolso: puertos.clock.ahora(),
      },
    });
  });

  it('debe registrar la transición condicionada a que la solicitud siga APROBADA', async () => {
    await desembolsar();

    expect(puertos.solicitudes.registrarTransicion).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5, estado: EstadoSolicitud.DESEMBOLSADA }),
      {
        estadoAnterior: EstadoSolicitud.APROBADA,
        usuarioId: 2,
        fecha: puertos.clock.ahora(),
        comentario: 'Desembolso en BAC_CREDOMATIC',
      },
    );
  });

  it('debe registrar el desembolso por el monto total del crédito', async () => {
    await desembolsar();

    expect(desembolsos.crear).toHaveBeenCalledWith(
      expect.objectContaining({ creditoId: 3, montoCentavos: 1_000_000, desembolsadoPorId: 2 }),
    );
  });

  it.each([EstadoSolicitud.PENDIENTE, EstadoSolicitud.RECHAZADA, EstadoSolicitud.DESEMBOLSADA])(
    'debe lanzar TransicionInvalidaError sin escribir cuando la solicitud está %s',
    async (estado) => {
      puertos.solicitudes.buscarPorId.mockResolvedValue(
        unaSolicitud().enEstado(estado).persistida(5),
      );

      await expect(desembolsar()).rejects.toThrow(TransicionInvalidaError);
      expectSinEscrituras();
    },
  );

  it('debe lanzar SolicitudNoEncontradaError sin escribir cuando la solicitud no existe', async () => {
    puertos.solicitudes.buscarPorId.mockResolvedValue(null);

    await expect(desembolsar()).rejects.toThrow(SolicitudNoEncontradaError);
    expectSinEscrituras();
  });

  it('debe lanzar CreditoNoEncontradoError sin escribir cuando la solicitud aprobada no tiene crédito', async () => {
    puertos.creditos.buscarPorSolicitud.mockResolvedValue(null);

    await expect(desembolsar()).rejects.toThrow(CreditoNoEncontradoError);
    expectSinEscrituras();
  });

  it('debe lanzar TransicionInvalidaError sin desembolsar cuando otra petición cambió el estado', async () => {
    puertos.solicitudes.registrarTransicion.mockResolvedValue(false);

    await expect(desembolsar()).rejects.toThrow(TransicionInvalidaError);
    expect(desembolsos.crear).not.toHaveBeenCalled();
  });
});
